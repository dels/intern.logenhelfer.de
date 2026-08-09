import { beforeEach, describe, expect, it } from 'vitest';
import { databaseConnectionDetails } from '../src/db.js';

describe('databaseConnectionDetails', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('parses a well-formed postgres URL with explicit port', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/mydb';
    const result = databaseConnectionDetails();
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
  });

  it('defaults port to 5432 when URL omits explicit port', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost/mydb';
    const result = databaseConnectionDetails();
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
  });

  it('exposes the username in the returned value (deliberate - see CLAUDE.md)', () => {
    process.env.DATABASE_URL = 'postgres://the_user:password@localhost/mydb';
    const result = databaseConnectionDetails();
    expect(result.username).toBe('the_user');
  });

  it('never exposes password in the returned value', () => {
    process.env.DATABASE_URL = 'postgres://user:secret_password@localhost/mydb';
    const result = databaseConnectionDetails();
    expect(JSON.stringify(result)).not.toContain('secret_password');
  });

  it('exposes the database name in the returned value (deliberate - see CLAUDE.md)', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost/the_dbname';
    const result = databaseConnectionDetails();
    expect(result.database).toBe('the_dbname');
  });

  it('returns nulls for everything when DATABASE_URL is unset', () => {
    delete process.env.DATABASE_URL;
    const result = databaseConnectionDetails();
    expect(result).toEqual({ host: null, port: null, username: null, database: null });
  });

  it('returns nulls for everything when DATABASE_URL is malformed', () => {
    process.env.DATABASE_URL = 'not-a-valid-url';
    const result = databaseConnectionDetails();
    expect(result).toEqual({ host: null, port: null, username: null, database: null });
  });

  it('extracts correct host, port, username and database from a complex URL', () => {
    process.env.DATABASE_URL = 'postgres://db_user:pass@db.example.com:6543/db_name';
    const result = databaseConnectionDetails();
    expect(result.host).toBe('db.example.com');
    expect(result.port).toBe(6543);
    expect(result.username).toBe('db_user');
    expect(result.database).toBe('db_name');
  });

  it('returns null username/database when the URL has no userinfo/path', () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432';
    const result = databaseConnectionDetails();
    expect(result.username).toBeNull();
    expect(result.database).toBeNull();
  });
});
