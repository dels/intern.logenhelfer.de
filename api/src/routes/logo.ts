import express, { Router } from 'express';
import type { Request } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { extractBoundary, parseMultipart } from '../lib/multipart.js';
import { sanitizeSvg } from '../lib/sanitizeSvg.js';

/**
 * Admin-facing custom logo ("Bijou") management - POST replaces the single
 * stored logo, DELETE resets to the bundled default. See public.ts's
 * `GET /api/v1/public/logo` for the unauthenticated read side (split into a
 * separate file because that one must not require auth, matching this
 * repo's existing appConfig.ts/public.ts split for the same reason).
 *
 * Storage is a singleton row (`custom_logos`, id always 1) rather than the
 * `attached_files` table - see
 * docs/superpowers/specs/2026-08-02-custom-logo-upload-design.md for why.
 */

const router = Router();

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/svg+xml']);

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Same dual-path extraction as attachedFiles.ts's `extractMultipartRequest`
 * (see that file's header for the full rationale): `req.files` when
 * express-openapi-validator's own multer instance already parsed the
 * request (production), the shared hand-rolled parser when this router is
 * mounted directly with no contract-validation middleware in front (this
 * route's own test harness).
 */
function extractUploadedFile(req: Request): { filename: string; contentType: string; content: Buffer } | undefined {
  if (Array.isArray(req.files)) {
    const uploaded = (req.files as MulterFile[]).find((f) => f.fieldname === 'file');
    return uploaded ? { filename: uploaded.originalname, contentType: uploaded.mimetype, content: uploaded.buffer } : undefined;
  }

  const contentType = req.headers['content-type'] ?? '';
  const boundary = extractBoundary(contentType);
  if (!Buffer.isBuffer(req.body) || !boundary) {
    return undefined;
  }
  return parseMultipart(req.body, boundary).file;
}

router.use(authenticateApiUser);

// POST /api/v1/logo (multipart/form-data)
router.post('/', express.raw({ type: 'multipart/form-data', limit: '10mb' }), async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AppConfig')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const file = extractUploadedFile(req);
    if (!file) {
      throw ApiError.badRequest('param is missing or the value is empty: file');
    }

    if (!ALLOWED_CONTENT_TYPES.has(file.contentType)) {
      throw ApiError.unprocessable(`unsupported content type: ${file.contentType}`);
    }

    if (file.content.length > MAX_LOGO_SIZE_BYTES) {
      throw ApiError.payloadTooLarge(`logo exceeds maximum allowed size of ${MAX_LOGO_SIZE_BYTES} bytes`);
    }

    // SVG is the one accepted type that can carry executable content - see
    // sanitizeSvg.ts's header for why this must happen before storage, not
    // just before render.
    const content =
      file.contentType === 'image/svg+xml' ? Buffer.from(sanitizeSvg(file.content.toString('utf-8')), 'utf-8') : file.content;

    const stored = await prisma.custom_logos.upsert({
      where: { id: 1 },
      create: { id: 1, content: new Uint8Array(content), content_type: file.contentType },
      update: { content: new Uint8Array(content), content_type: file.contentType },
    });

    res.status(201).json({ content_type: stored.content_type, updated_at: stored.updated_at.toISOString() });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/logo
router.delete('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AppConfig')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await prisma.custom_logos.deleteMany({ where: { id: 1 } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
