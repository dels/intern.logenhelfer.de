import { beforeEach, describe, expect, it } from 'vitest';
import { databaseHostPort } from '../src/db.js';

describe('databaseHostPort', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('parses a well-formed postgres URL with explicit port', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost:5432/mydb';
    const result = databaseHostPort();
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
  });

  it('defaults port to 5432 when URL omits explicit port', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost/mydb';
    const result = databaseHostPort();
    expect(result.host).toBe('localhost');
    expect(result.port).toBe(5432);
  });

  it('never exposes username in the returned value', () => {
    process.env.DATABASE_URL = 'postgres://secret_user:password@localhost/mydb';
    const result = databaseHostPort();
    expect(JSON.stringify(result)).not.toContain('secret_user');
  });

  it('never exposes password in the returned value', () => {
    process.env.DATABASE_URL = 'postgres://user:secret_password@localhost/mydb';
    const result = databaseHostPort();
    expect(JSON.stringify(result)).not.toContain('secret_password');
  });

  it('never exposes database name in the returned value', () => {
    process.env.DATABASE_URL = 'postgres://user:password@localhost/secret_dbname';
    const result = databaseHostPort();
    expect(JSON.stringify(result)).not.toContain('secret_dbname');
  });

  it('returns {host: null, port: null} when DATABASE_URL is unset', () => {
    delete process.env.DATABASE_URL;
    const result = databaseHostPort();
    expect(result).toEqual({ host: null, port: null });
  });

  it('returns {host: null, port: null} when DATABASE_URL is malformed', () => {
    process.env.DATABASE_URL = 'not-a-valid-url';
    const result = databaseHostPort();
    expect(result).toEqual({ host: null, port: null });
  });

  it('extracts correct host and port from a complex hostname', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@db.example.com:6543/dbname';
    const result = databaseHostPort();
    expect(result.host).toBe('db.example.com');
    expect(result.port).toBe(6543);
  });
});
