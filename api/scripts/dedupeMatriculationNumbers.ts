import { fileURLToPath } from 'node:url';

import { prisma } from '../src/db.js';

/**
 * One-off (but safe to re-run) data-repair script: `resolveMatriculationNumber`'s
 * old auto-bump-on-collision logic (formerly api/src/routes/members.ts) was a
 * check-then-insert race, not atomic - concurrent creates could both pass the
 * pre-check and persist the same matriculation_number. Before a real DB
 * `@unique` constraint is added on `users.matriculation_number`, any existing
 * duplicates must be resolved or `CREATE UNIQUE INDEX` fails outright.
 *
 * Scope matches the pre-existing collision check this replaces: ALL rows,
 * including soft-deleted ones (`deleted: true`) - the old check-then-insert
 * logic never filtered by `deleted` either, so a soft-deleted member's old
 * number was already just as capable of blocking a new member's number as an
 * active one's. See this plan's Global Constraints for why that scope is
 * kept, not narrowed.
 *
 * For each group of rows sharing a matriculation_number, the lowest `id` (the
 * row created first, so "owns" the number under a first-write-wins rule)
 * keeps it; every other row in the group is reassigned to `runningMax + 1`,
 * `runningMax + 2`, ... in ascending `id` order, where `runningMax` starts at
 * the highest matriculation_number across ALL users and is bumped after every
 * reassignment so two losing rows never collide with each other either.
 */
export async function dedupeMatriculationNumbers(): Promise<{ reassignedUserIds: number[] }> {
  const groups = await prisma.users.groupBy({
    by: ['matriculation_number'],
    where: { matriculation_number: { not: null } },
    _count: { matriculation_number: true },
    having: { matriculation_number: { _count: { gt: 1 } } },
  });

  if (groups.length === 0) return { reassignedUserIds: [] };

  const maxAgg = await prisma.users.aggregate({ _max: { matriculation_number: true } });
  let runningMax = maxAgg._max.matriculation_number ?? 0;

  const reassignedUserIds: number[] = [];

  for (const group of groups) {
    const candidate = group.matriculation_number;
    if (candidate === null) continue;

    const rows = await prisma.users.findMany({
      where: { matriculation_number: candidate },
      orderBy: { id: 'asc' },
      select: { id: true },
    });

    // rows[0] (lowest id) keeps the number - reassign every row after it.
    for (const row of rows.slice(1)) {
      runningMax += 1;
      await prisma.users.update({ where: { id: row.id }, data: { matriculation_number: runningMax } });
      reassignedUserIds.push(row.id);
      console.log(`[dedupe-matriculation-numbers] reassigned user ${row.id}: ${candidate} -> ${runningMax}`);
    }
  }

  return { reassignedUserIds };
}

// Only run when this file is executed directly (`tsx scripts/dedupeMatriculationNumbers.ts`),
// not when imported by a test - same pattern as scripts/eventsNightly.ts.
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  dedupeMatriculationNumbers()
    .then(({ reassignedUserIds }) => {
      console.log(`[dedupe-matriculation-numbers] done - ${reassignedUserIds.length} row(s) reassigned`);
    })
    .catch((err) => {
      console.error('[dedupe-matriculation-numbers] fatal error', err);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
