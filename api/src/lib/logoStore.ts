import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../db.js';
import { deriveLogoVariants } from './logoVariants.js';

const SINGLETON_ID = 1;
const DEFAULT_LOGO_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/bijoux.jpg');

export type LogoVariantName = 'icon-192' | 'icon-512' | 'icon-512-maskable' | 'apple-touch-icon';

const COLUMN_BY_VARIANT = {
  'icon-192': 'icon_192',
  'icon-512': 'icon_512',
  'icon-512-maskable': 'icon_512_maskable',
  'apple-touch-icon': 'apple_touch_icon',
} as const;

/** Replaces the singleton logo row, deriving every icon variant from `buffer`. Returns the new `updated_at`. */
export async function upsertLogo(buffer: Buffer, mimeType: string): Promise<Date> {
  const variants = await deriveLogoVariants(buffer);
  const now = new Date();
  const data = {
    original: new Uint8Array(buffer),
    original_mime: mimeType,
    icon_192: new Uint8Array(variants.icon192),
    icon_512: new Uint8Array(variants.icon512),
    icon_512_maskable: new Uint8Array(variants.icon512Maskable),
    apple_touch_icon: new Uint8Array(variants.appleTouchIcon),
    updated_at: now,
  };
  const row = await prisma.app_logo.upsert({
    where: { id: SINGLETON_ID },
    create: { id: SINGLETON_ID, ...data },
    update: data,
  });
  return row.updated_at;
}

/** Seeds the singleton row from the bundled default logo (`api/assets/bijoux.jpg`) if no row exists yet. Idempotent. */
export async function ensureLogoSeeded(): Promise<void> {
  const existing = await prisma.app_logo.findUnique({ where: { id: SINGLETON_ID } });
  if (existing) return;
  const defaultImage = await readFile(DEFAULT_LOGO_PATH);
  await upsertLogo(defaultImage, 'image/jpeg');
}

export async function getLogoVariant(variant: LogoVariantName): Promise<Buffer | null> {
  const row = await prisma.app_logo.findUnique({ where: { id: SINGLETON_ID } });
  if (!row) return null;
  return Buffer.from(row[COLUMN_BY_VARIANT[variant]]);
}

export async function getLogoUpdatedAt(): Promise<Date | null> {
  const row = await prisma.app_logo.findUnique({ where: { id: SINGLETON_ID }, select: { updated_at: true } });
  return row?.updated_at ?? null;
}
