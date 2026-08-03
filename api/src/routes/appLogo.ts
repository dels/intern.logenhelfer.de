import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { upsertLogo } from '../lib/logoStore.js';

/**
 * POST /api/v1/app_logo - replaces the lodge logo used to derive the PWA
 * manifest's icons (see routes/public.ts's manifest.webmanifest/logo
 * endpoints for where these variants are actually served). Gated by the
 * same `manage AppConfig` ability as the rest of Settings (routes/appConfig.ts) -
 * no new permission concept.
 *
 * Relies on express-openapi-validator's own multer instance (mounted ahead
 * of every router in app.ts) to populate `req.files` with the parsed
 * multipart body in production - see middleware/contractValidation.ts's
 * file header for why this is the actually-enforced size/type-limited path,
 * not a route-owned fallback parser (unlike routes/attachedFiles.ts, which
 * predates that middleware).
 */

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg']);

const router = Router();

router.use(authenticateApiUser);

router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AppConfig')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const uploaded = Array.isArray(req.files) ? (req.files as MulterFile[]).find((f) => f.fieldname === 'file') : undefined;
    if (!uploaded) {
      throw ApiError.badRequest('param is missing or the value is empty: file');
    }
    if (!ALLOWED_MIME_TYPES.has(uploaded.mimetype)) {
      throw ApiError.unprocessable(`unsupported content type: ${uploaded.mimetype}`);
    }

    let updatedAt: Date;
    try {
      updatedAt = await upsertLogo(uploaded.buffer, uploaded.mimetype);
    } catch {
      throw ApiError.unprocessable('uploaded file is not a valid image');
    }

    res.status(200).json({ updated_at: updatedAt.toISOString() });
  } catch (err) {
    next(err);
  }
});

export default router;
