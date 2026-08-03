import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { deriveLogoVariants } from '../../src/lib/logoVariants.js';

async function samplePng(): Promise<Buffer> {
  return sharp({ create: { width: 400, height: 300, channels: 3, background: '#1E56B0' } }).png().toBuffer();
}

describe('deriveLogoVariants', () => {
  it('produces every variant at its required pixel size', async () => {
    const variants = await deriveLogoVariants(await samplePng());

    await expect(sharp(variants.icon192).metadata()).resolves.toMatchObject({ width: 192, height: 192 });
    await expect(sharp(variants.icon512).metadata()).resolves.toMatchObject({ width: 512, height: 512 });
    await expect(sharp(variants.icon512Maskable).metadata()).resolves.toMatchObject({ width: 512, height: 512 });
    await expect(sharp(variants.appleTouchIcon).metadata()).resolves.toMatchObject({ width: 180, height: 180 });
  });

  it('pads the maskable variant into the safe zone instead of filling edge-to-edge', async () => {
    // A solid-color source makes the padding ring detectable: the maskable
    // variant's corner pixel must be the background fill color (#F7F8FA ->
    // [247, 248, 250]), not the source content color - proving the content
    // was scaled down and centered rather than stretched to fill the canvas.
    const variants = await deriveLogoVariants(await samplePng());
    const { data } = await sharp(variants.icon512Maskable).raw().toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([247, 248, 250]);
  });

  it('rejects a non-image input', async () => {
    await expect(deriveLogoVariants(Buffer.from('not an image'))).rejects.toThrow();
  });
});
