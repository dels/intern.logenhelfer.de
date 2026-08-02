import type { Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, apiErrorHandler } from '../../src/lib/errors.js';

// Pure-logic unit tests for lib/errors.ts's ApiError class + apiErrorHandler
// middleware - no DB/Prisma involved, so these run fully offline.

function mockResponse(): Response {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
}

describe('ApiError.payloadTooLarge', () => {
  it('has a 413 status', () => {
    expect(ApiError.payloadTooLarge('x').status).toBe(413);
  });

  it('carries the code and detail it was constructed with', () => {
    const err = ApiError.payloadTooLarge('file exceeds maximum allowed size of 100 bytes');
    expect(err.code).toBe('payload_too_large');
    expect(err.detail).toBe('file exceeds maximum allowed size of 100 bytes');
  });

  it('produces a {error, detail} 413 JSON response via apiErrorHandler', () => {
    const res = mockResponse();
    apiErrorHandler(ApiError.payloadTooLarge('too big'), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: 'payload_too_large', detail: 'too big' });
  });

  it('omits detail from the JSON body when constructed without one', () => {
    const res = mockResponse();
    apiErrorHandler(ApiError.payloadTooLarge(), {} as Request, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith({ error: 'payload_too_large' });
  });
});
