import sharp from 'sharp';
import { beforeEach, describe, expect, it } from 'vitest';

import { ensureLogoSeeded, getLogoUpdatedAt, getLogoVariant, upsertLogo } from '../../src/lib/logoStore.js';
import { resetDb } from '../helpers/db.js';

async function samplePng(): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: '#1E56B0' } }).png().toBuffer();
}

describe('logoStore', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('getLogoVariant / getLogoUpdatedAt', () => {
    it('returns null when no row exists yet', async () => {
      expect(await getLogoVariant('icon-192')).toBeNull();
      expect(await getLogoUpdatedAt()).toBeNull();
    });
  });

  describe('ensureLogoSeeded', () => {
    it('seeds every variant from the bundled default image when no row exists', async () => {
      await ensureLogoSeeded();

      const icon192 = await getLogoVariant('icon-192');
      expect(icon192).not.toBeNull();
      await expect(sharp(icon192!).metadata()).resolves.toMatchObject({ width: 192, height: 192 });
      expect(await getLogoUpdatedAt()).not.toBeNull();
    });

    it('is a no-op when a row already exists', async () => {
      const firstUpdatedAt = await upsertLogo(await samplePng(), 'image/png');

      await ensureLogoSeeded();

      expect(await getLogoUpdatedAt()).toEqual(firstUpdatedAt);
    });
  });

  describe('upsertLogo', () => {
    it('replaces every variant and bumps updated_at', async () => {
      await ensureLogoSeeded();
      const firstUpdatedAt = await getLogoUpdatedAt();

      const newUpdatedAt = await upsertLogo(await samplePng(), 'image/png');

      expect(newUpdatedAt.getTime()).toBeGreaterThanOrEqual(firstUpdatedAt!.getTime());
      const icon512 = await getLogoVariant('icon-512');
      await expect(sharp(icon512!).metadata()).resolves.toMatchObject({ width: 512, height: 512 });
    });
  });
});
