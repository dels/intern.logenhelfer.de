import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../db.js';
import { deriveLogoVariants } from './logoVariants.js';

const SINGLETON_ID = 1;
const DEFAULT_LOGO_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/bijoux.jpg');

export type LogoVariantName = 'icon-192' | 'icon-512' | 'icon-512-maskable' | 'apple-touch-icon';

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
  switch (variant) {
    case 'icon-192': {
      const row = await prisma.app_logo.findUnique({
        where: { id: SINGLETON_ID },
        select: { icon_192: true },
      });
      return row ? Buffer.from(row.icon_192) : null;
    }
    case 'icon-512': {
      const row = await prisma.app_logo.findUnique({
        where: { id: SINGLETON_ID },
        select: { icon_512: true },
      });
      return row ? Buffer.from(row.icon_512) : null;
    }
    case 'icon-512-maskable': {
      const row = await prisma.app_logo.findUnique({
        where: { id: SINGLETON_ID },
        select: { icon_512_maskable: true },
      });
      return row ? Buffer.from(row.icon_512_maskable) : null;
    }
    case 'apple-touch-icon': {
      const row = await prisma.app_logo.findUnique({
        where: { id: SINGLETON_ID },
        select: { apple_touch_icon: true },
      });
      return row ? Buffer.from(row.apple_touch_icon) : null;
    }
  }
}

export async function getLogoUpdatedAt(): Promise<Date | null> {
  const row = await prisma.app_logo.findUnique({ where: { id: SINGLETON_ID }, select: { updated_at: true } });
  return row?.updated_at ?? null;
}
