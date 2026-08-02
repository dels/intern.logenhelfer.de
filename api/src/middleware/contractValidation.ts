import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import * as OpenApiValidator from 'express-openapi-validator';

/**
 * Request + response contract validation against the shared repo-root
 * `openapi/openapi.yaml`, mirroring committee-rails' pervasive
 * `assert_response_schema_confirm` pattern used throughout the Rails spec
 * suite (rails-app/spec/requests/api/v1/*) - the idea being every response
 * this API sends is checked against the same OpenAPI contract the Rails
 * suite already enforces, so the two backends can't silently drift apart.
 *
 * Ready to `app.use(...)` in app.ts (a later integration step does the
 * actual mounting - this file intentionally doesn't touch app.ts itself).
 */

const DEFAULT_API_SPEC_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../openapi/openapi.yaml');

// express-openapi-validator's own default (when no `fileUploader` option is
// passed at all) is `options.fileUploader = {}` (see
// node_modules/express-openapi-validator/dist/openapi.validator.js's
// OpenApiValidator constructor), which flows straight into
// `multer(options.multerOpts)` in dist/middlewares/openapi.multipart.js with
// no `limits` object at all. Multer passes that through unchanged to busboy,
// whose own default `limits.fileSize` is `Infinity` - i.e. UNCONFIGURED means
// NO SIZE LIMIT, not some sane implicit cap. Every multipart upload route
// (currently only POST /api/v1/attached_files) would buffer an arbitrarily
// large request body fully into memory before this app ever gets a chance to
// reject it. `attachedFiles.ts`'s own `express.raw({limit:'20mb'})` does NOT
// help here: that Express body-parser only runs in that route's own
// test-harness path (see attachedFiles.ts's extractMultipartRequest doc
// comment) - in production, express-openapi-validator's multer instance
// consumes the request stream first, and express.raw sees an already-empty
// body. This constant is the actual enforced limit in production; keep it in
// sync with the `20mb` figure `attachedFiles.ts` already documents elsewhere.
//
// This is now the env-driven CEILING, fixed per-environment via
// `.env.<env>`'s `MAX_UPLOAD_FILE_SIZE_MB`, defaulting to 20 for any
// environment that hasn't set it yet (preserving today's exact behavior
// unchanged). It is distinct from the admin-editable AppConfig
// `max_upload_file_size` key (lib/appConfig.ts) - that's the SOFT limit,
// adjustable at runtime within `[0, ceiling]` without a restart, enforced
// inside attachedFiles.ts's POST handler after the file has already been
// parsed, not here. nginx (a separate task, see infra/edge/default.conf.template
// and app/nginx.conf.template) reads this same MAX_UPLOAD_FILE_SIZE_MB env
// var for its own `client_max_body_size`, so all three layers move together.
// Like nginx's config, this constant is evaluated once at module load -
// fixed until the process restarts, which is expected and fine (the ceiling
// is meant to be a deploy-time decision, not a live-editable one; that's
// what the AppConfig soft limit is for).
export const MULTIPART_FILE_SIZE_LIMIT_BYTES = (Number(process.env.MAX_UPLOAD_FILE_SIZE_MB) || 20) * 1024 * 1024;

export interface ContractValidationOptions {
  /** Defaults to the repo-root openapi/openapi.yaml, resolved from this file's own location. */
  apiSpec?: string;
  /**
   * Path patterns (matched against `req.path` via `String#endsWith` for a
   * plain string, or `RegExp#test` for a RegExp) to exclude from *response*
   * validation only - requests to these paths are still request-validated
   * normally. Intended for binary `GET .../download` endpoints (e.g.
   * `AttachedFile#download`), whose response bodies aren't JSON and so
   * can't be checked against a JSON schema. Everything not matched here is
   * both request- and response-validated.
   */
  excludeResponseValidationPaths?: (string | RegExp)[];
  /** Validate the OpenAPI document itself on load. Defaults to true. */
  validateApiSpec?: boolean;
  /**
   * Max accepted size (bytes) for any `format: binary` multipart part (e.g.
   * the `file` field on `POST /api/v1/attached_files`), enforced by
   * express-openapi-validator's internal multer instance. Defaults to
   * `MULTIPART_FILE_SIZE_LIMIT_BYTES` (20MB) - see that constant's comment
   * for why an explicit value is required at all here. A request exceeding
   * this is rejected with 413 before the body is fully buffered.
   */
  multipartFileSizeLimitBytes?: number;
}

function matchesAny(patterns: (string | RegExp)[], value: string): boolean {
  return patterns.some((pattern) => (typeof pattern === 'string' ? value.endsWith(pattern) : pattern.test(value)));
}

/**
 * Runs a precomputed express-openapi-validator handler chain (as returned
 * by `OpenApiValidator.middleware(...)`) sequentially, the same way Express
 * itself would if each handler were mounted individually via `app.use`.
 * None of this library's returned handlers are 4-arg error handlers (each
 * reports failure by calling `next(err)`, same as any normal middleware -
 * see its `installMiddleware` source), so a plain 3-arg recursive runner
 * reproduces Express's own dispatch semantics exactly.
 */
function runChain(handlers: RequestHandler[], req: Request, res: Response, next: NextFunction): void {
  let index = 0;

  function step(err?: unknown): void {
    if (err) {
      next(err as never);
      return;
    }
    const handler = handlers[index];
    index += 1;
    if (!handler) {
      next();
      return;
    }
    handler(req, res, step);
  }

  step();
}

/**
 * Builds contract-validation middleware. Because express-openapi-validator
 * has no built-in "validate requests but not responses for these specific
 * paths" option (its `ignorePaths` skips a path from *all* validation, not
 * just responses), this precomputes two handler chains - a full
 * request+response chain and a request-only chain - and picks between them
 * per-request based on `excludeResponseValidationPaths`.
 */
export function createContractValidationMiddleware(options: ContractValidationOptions = {}): RequestHandler {
  const apiSpec = options.apiSpec ?? DEFAULT_API_SPEC_PATH;
  const validateApiSpec = options.validateApiSpec ?? true;
  const excludePaths = options.excludeResponseValidationPaths ?? [];
  const fileUploader = { limits: { fileSize: options.multipartFileSizeLimitBytes ?? MULTIPART_FILE_SIZE_LIMIT_BYTES } };

  const fullHandlers = OpenApiValidator.middleware({
    apiSpec,
    validateApiSpec,
    validateRequests: true,
    validateResponses: true,
    fileUploader,
  }) as RequestHandler[];

  const requestOnlyHandlers =
    excludePaths.length > 0
      ? (OpenApiValidator.middleware({
          apiSpec,
          validateApiSpec,
          validateRequests: true,
          validateResponses: false,
          fileUploader,
        }) as RequestHandler[])
      : null;

  return function contractValidation(req: Request, res: Response, next: NextFunction): void {
    const handlers = requestOnlyHandlers && matchesAny(excludePaths, req.path) ? requestOnlyHandlers : fullHandlers;
    runChain(handlers, req, res, next);
  };
}
