import type { NextFunction, Request, Response } from 'express';

// Port of the rescue_from mappings in
// rails-app/app/controllers/api/v1/base_controller.rb, shared by every route
// in this API (not just auth). 'payload_too_large' isn't a Rails rescue_from
// mapping (Rails never had a route-level file-size guard of its own) - it's
// net-new, added so a route handler can throw a 413 in the exact same shape
// express-openapi-validator's own 413s already produce (see
// apiErrorHandler's isOpenApiValidationError branch below), for checks that
// run AFTER the multipart body is already parsed (e.g. attachedFiles.ts's
// AppConfig-backed max_upload_file_size soft limit) rather than at the
// multer/busboy layer that produces the openapi-validator-originated 413s.
export type ApiErrorCode = 'not_found' | 'bad_request' | 'unprocessable' | 'unauthorized' | 'payload_too_large';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  not_found: 404,
  bad_request: 400,
  unprocessable: 422,
  unauthorized: 401,
  payload_too_large: 413,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly detail?: string;

  constructor(code: ApiErrorCode, detail?: string) {
    super(detail ?? code);
    this.name = 'ApiError';
    this.code = code;
    this.detail = detail;
  }

  get status(): number {
    return STATUS_BY_CODE[this.code];
  }

  static notFound(detail?: string): ApiError {
    return new ApiError('not_found', detail);
  }

  static badRequest(detail?: string): ApiError {
    return new ApiError('bad_request', detail);
  }

  static unprocessable(detail?: string): ApiError {
    return new ApiError('unprocessable', detail);
  }

  static unauthorized(detail?: string): ApiError {
    return new ApiError('unauthorized', detail);
  }

  static payloadTooLarge(detail?: string): ApiError {
    return new ApiError('payload_too_large', detail);
  }
}

/**
 * express-openapi-validator's thrown errors (framework/types.js's HttpError
 * and its subclasses - BadRequest, Unauthorized, NotFound, etc.) all carry a
 * numeric `status` and a `message`, but aren't ApiError instances (they come
 * from createContractValidationMiddleware, not from route code) - duck-type
 * on the shape rather than importing the library's error classes, since only
 * `error.{BadRequest,Unauthorized,...}` subclasses are exported, not the
 * shared HttpError base they all extend.
 */
function isOpenApiValidationError(err: unknown): err is Error & { status: number } {
  return err instanceof Error && typeof (err as { status?: unknown }).status === 'number';
}

/**
 * Express error-handling middleware (mount last, after all routes) producing
 * the exact {error, detail?} JSON shapes BaseController's rescue_from blocks
 * produce in Rails. Anything that isn't an ApiError (or an openapi-validator
 * validation error mappable onto one of the four known codes) is an unmapped
 * bug, not one of the known failure modes - it surfaces as a 500 instead of
 * being force-fit into one of the four known codes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express only recognizes error middleware by arity (4 params).
export function apiErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    const body: { error: ApiErrorCode; detail?: string } = { error: err.code };
    if (err.detail !== undefined) {
      body.detail = err.detail;
    }
    res.status(err.status).json(body);
    return;
  }

  if (isOpenApiValidationError(err)) {
    // Request-validation failures (400) are the client's fault - surface
    // them the same way a hand-thrown ApiError.badRequest/.unauthorized/
    // .notFound would be. 413 is also the client's fault (an oversized
    // multipart upload - see contractValidation.ts's fileUploader option,
    // enforced by express-openapi-validator's internal multer instance,
    // whose openapi.multipart.js maps LIMIT_FILE_SIZE/LIMIT_PART_COUNT
    // multer errors to status 413 itself). Anything else not explicitly
    // listed here (in practice: response-validation failures, which
    // express-openapi-validator raises as a 500 - our own contract bug, not
    // the caller's) falls through to the generic 500 below rather than
    // being force-fit into the wrong bucket.
    if (err.status === 400) {
      res.status(400).json({ error: 'bad_request', detail: err.message });
      return;
    }
    if (err.status === 401) {
      res.status(401).json({ error: 'unauthorized', detail: err.message });
      return;
    }
    if (err.status === 404) {
      res.status(404).json({ error: 'not_found', detail: err.message });
      return;
    }
    if (err.status === 413) {
      res.status(413).json({ error: 'payload_too_large', detail: err.message });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: 'internal_server_error' });
}
