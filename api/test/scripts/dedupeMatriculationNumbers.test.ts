import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { dedupeMatriculationNumbers } from '../../scripts/dedupeMatriculationNumbers.js';

// Task 2 (2026-07-17-user-management.md) added a real DB-level `@unique`
// constraint on users.matriculation_number (see
// test/models/matriculationNumberUniqueness.test.ts). That makes it
// impossible to *create* two rows sharing a non-null matriculation_number via
// any insert path any more - which is exactly the data state this script's
// reassignment logic exists to resolve.
//
// So this file is split:
// - Tests that don't need duplicate data to exist (the no-op / null-ignoring
//   paths) still run as real-DB integration tests, via createUser() + a real
//   dedupeMatriculationNumbers() call - this still proves the real
//   groupBy/having query works against real Postgres.
// - Tests that need a collision to exist in order to exercise the
//   reassignment logic instead spy on prisma.users' groupBy/aggregate/
//   findMany/update methods (vi.spyOn on the real singleton, not vi.mock -
//   vi.mock('../../src/db.js') would hoist and replace that module for this
//   whole file's module graph, including test/helpers/factories.ts's own
//   import of `prisma` from the same path, which would break createUser()
//   in the real-DB tests below). vi.spyOn instead patches methods in place
//   on the one shared prisma singleton, so it can be scoped per test with
//   afterEach(() => vi.restoreAllMocks()) without touching module
//   resolution at all.
describe('dedupeMatriculationNumbers', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('real DB (no duplicate rows involved - still possible post-constraint)', () => {
    it('does nothing when there are no duplicates', async () => {
      const a = await createUser({ matriculation_number: 10 });
      const b = await createUser({ matriculation_number: 20 });

      const result = await dedupeMatriculationNumbers();

      expect(result.reassignedUserIds).toEqual([]);
      expect((await prisma.users.findUniqueOrThrow({ where: { id: a.id } })).matriculation_number).toBe(10);
      expect((await prisma.users.findUniqueOrThrow({ where: { id: b.id } })).matriculation_number).toBe(20);
    });

    it('ignores rows with a null matriculation_number', async () => {
      await createUser({});
      await createUser({});

      const result = await dedupeMatriculationNumbers();

      expect(result.reassignedUserIds).toEqual([]);
    });
  });

  describe('mocked prisma (collision scenarios that can no longer be created as real rows)', () => {
    it('leaves the lowest-id row in a colliding group unchanged and reassigns the rest above the current max', async () => {
      const groupBySpy = vi
        .spyOn(prisma.users, 'groupBy')
        // @ts-expect-error - groupBy's return type is inferred from its call-site generics; the shape below is all the script actually reads.
        .mockResolvedValue([{ matriculation_number: 100, _count: { matriculation_number: 3 } }]);
      const aggregateSpy = vi
        .spyOn(prisma.users, 'aggregate')
        // @ts-expect-error - same as above, only _max.matriculation_number is read.
        .mockResolvedValue({ _max: { matriculation_number: 500 } });
      const findManySpy = vi
        .spyOn(prisma.users, 'findMany')
        // @ts-expect-error - only id is read from each row.
        .mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
      const updateSpy = vi.spyOn(prisma.users, 'update').mockResolvedValue({} as never);

      const result = await dedupeMatriculationNumbers();

      // Row 1 (lowest id) keeps 100 and is never updated; rows 2 and 3 move
      // above the pre-existing max of 500, in ascending-id order.
      expect(result.reassignedUserIds).toEqual([2, 3]);
      expect(updateSpy).toHaveBeenCalledTimes(2);
      expect(updateSpy).toHaveBeenNthCalledWith(1, { where: { id: 2 }, data: { matriculation_number: 501 } });
      expect(updateSpy).toHaveBeenNthCalledWith(2, { where: { id: 3 }, data: { matriculation_number: 502 } });

      expect(groupBySpy).toHaveBeenCalledTimes(1);
      expect(aggregateSpy).toHaveBeenCalledTimes(1);
      expect(findManySpy).toHaveBeenCalledTimes(1);
      // The "lowest id keeps the number" guarantee depends entirely on the
      // DB returning rows in ascending-id order - assert the query actually
      // requests that, not just that the mock's (already-sorted) return
      // value was consumed correctly.
      expect(findManySpy).toHaveBeenCalledWith({
        where: { matriculation_number: 100 },
        orderBy: { id: 'asc' },
        select: { id: true },
      });
    });

    it('dedupes collisions that include a soft-deleted row (uniqueness scope is global, not active-only)', async () => {
      // A real soft-deleted collision row can no longer be created (the DB
      // constraint has no `deleted`-scoped exception), so the only way left
      // to prove the script's query scope is truly global - not filtered to
      // active users - is to assert the exact `where` passed to groupBy has
      // no `deleted` key at all.
      const groupBySpy = vi
        .spyOn(prisma.users, 'groupBy')
        // @ts-expect-error - see above.
        .mockResolvedValue([{ matriculation_number: 7, _count: { matriculation_number: 2 } }]);
      vi.spyOn(prisma.users, 'aggregate')
        // @ts-expect-error - see above.
        .mockResolvedValue({ _max: { matriculation_number: 7 } });
      vi.spyOn(prisma.users, 'findMany')
        // @ts-expect-error - see above.
        .mockResolvedValue([{ id: 10 }, { id: 11 }]); // id 11 is the (formerly) soft-deleted loser.
      const updateSpy = vi.spyOn(prisma.users, 'update').mockResolvedValue({} as never);

      const result = await dedupeMatriculationNumbers();

      expect(result.reassignedUserIds).toEqual([11]);
      expect(updateSpy).toHaveBeenCalledWith({ where: { id: 11 }, data: { matriculation_number: 8 } });

      expect(groupBySpy).toHaveBeenCalledWith({
        by: ['matriculation_number'],
        where: { matriculation_number: { not: null } },
        _count: { matriculation_number: true },
        having: { matriculation_number: { _count: { gt: 1 } } },
      });
    });

    it('never lets reassigned rows from two different collision groups collide with each other', async () => {
      vi.spyOn(prisma.users, 'groupBy').mockResolvedValue([
        // @ts-expect-error - see above.
        { matriculation_number: 50, _count: { matriculation_number: 3 } },
        { matriculation_number: 200, _count: { matriculation_number: 2 } },
      ]);
      vi.spyOn(prisma.users, 'aggregate')
        // @ts-expect-error - see above.
        .mockResolvedValue({ _max: { matriculation_number: 500 } });
      const findManySpy = vi
        .spyOn(prisma.users, 'findMany')
        // Group A (50): rows 1,2,3 - losers 2 and 3.
        // @ts-expect-error - see above.
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }, { id: 3 }])
        // Group B (200): rows 4,5 - loser 5.
        // @ts-expect-error - see above.
        .mockResolvedValueOnce([{ id: 4 }, { id: 5 }]);
      const updateSpy = vi.spyOn(prisma.users, 'update').mockResolvedValue({} as never);

      const result = await dedupeMatriculationNumbers();

      // runningMax (starting at 500) is threaded across BOTH groups, not
      // reset per group: group A's losers get 501/502, group B's loser
      // continues from there at 503, not restarting at 501.
      expect(result.reassignedUserIds).toEqual([2, 3, 5]);
      expect(updateSpy).toHaveBeenCalledTimes(3);
      expect(updateSpy).toHaveBeenNthCalledWith(1, { where: { id: 2 }, data: { matriculation_number: 501 } });
      expect(updateSpy).toHaveBeenNthCalledWith(2, { where: { id: 3 }, data: { matriculation_number: 502 } });
      expect(updateSpy).toHaveBeenNthCalledWith(3, { where: { id: 5 }, data: { matriculation_number: 503 } });

      expect(findManySpy).toHaveBeenCalledTimes(2);
      // Same ordering guarantee as above, but across both collision groups:
      // each group's findMany call must independently request ascending-id
      // order, not just the first one.
      expect(findManySpy).toHaveBeenNthCalledWith(1, {
        where: { matriculation_number: 50 },
        orderBy: { id: 'asc' },
        select: { id: true },
      });
      expect(findManySpy).toHaveBeenNthCalledWith(2, {
        where: { matriculation_number: 200 },
        orderBy: { id: 'asc' },
        select: { id: true },
      });
    });

    it('is idempotent - a second real-world run after collisions are already resolved must be a safe no-op', async () => {
      // A second run finding no collision groups (groupBy resolves []) is
      // exactly what happens after a first run has already deduped
      // everything - this is the only way left to exercise that path, since
      // "already-deduped data" is indistinguishable from "never had
      // duplicates" from the script's point of view.
      const groupBySpy = vi.spyOn(prisma.users, 'groupBy').mockResolvedValue([]);
      const aggregateSpy = vi.spyOn(prisma.users, 'aggregate');
      const findManySpy = vi.spyOn(prisma.users, 'findMany');
      const updateSpy = vi.spyOn(prisma.users, 'update');

      const result = await dedupeMatriculationNumbers();

      expect(result).toEqual({ reassignedUserIds: [] });
      expect(groupBySpy).toHaveBeenCalledTimes(1);
      expect(aggregateSpy).not.toHaveBeenCalled();
      expect(findManySpy).not.toHaveBeenCalled();
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });
});
