import { describe, expect, it, beforeEach } from 'vitest';

import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

describe('users.matriculation_number uniqueness (DB-level)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects inserting a second user with the same matriculation_number', async () => {
    await createUser({ matriculation_number: 4242 });

    await expect(createUser({ matriculation_number: 4242 })).rejects.toMatchObject({ code: 'P2002' });
  });

  it('allows multiple users with a null matriculation_number (Postgres treats NULLs as distinct under a unique index)', async () => {
    const a = await createUser({});
    const b = await createUser({});

    expect(a.matriculation_number).toBeNull();
    expect(b.matriculation_number).toBeNull();
  });

  it('rejects a collision even when the existing holder is soft-deleted (global uniqueness scope)', async () => {
    await createUser({ matriculation_number: 55, deleted: true });

    await expect(createUser({ matriculation_number: 55 })).rejects.toMatchObject({ code: 'P2002' });
  });
});
