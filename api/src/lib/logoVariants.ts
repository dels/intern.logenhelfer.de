import sharp from 'sharp';

/**
 * Must match app/src/theme.ts's palette.background.default - api and app
 * are separate packages with no shared constants module, so this is kept
 * in sync by hand (a single hex string, changed rarely).
 */
const MASKABLE_BACKGROUND = '#F7F8FA';
const MASKABLE_CONTENT_RATIO = 0.8;

export interface LogoVariants {
  icon192: Buffer;
  icon512: Buffer;
  icon512Maskable: Buffer;
  appleTouchIcon: Buffer;
}

async function squareIcon(input: Buffer, size: number): Promise<Buffer> {
  return sharp(input).resize(size, size, { fit: 'cover' }).png().toBuffer();
}

async function maskableIcon(input: Buffer, size: number): Promise<Buffer> {
  const contentSize = Math.round(size * MASKABLE_CONTENT_RATIO);
  const content = await sharp(input).resize(contentSize, contentSize, { fit: 'cover' }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background: MASKABLE_BACKGROUND } })
    .composite([{ input: content, gravity: 'center' }])
    .png()
    .toBuffer();
}

async function flattenedIcon(input: Buffer, size: number): Promise<Buffer> {
  return sharp(input).resize(size, size, { fit: 'cover' }).flatten({ background: MASKABLE_BACKGROUND }).png().toBuffer();
}

/** Derives every PWA icon variant from an arbitrary source image. Rejects if `input` isn't a decodable image. */
export async function deriveLogoVariants(input: Buffer): Promise<LogoVariants> {
  const [icon192, icon512, icon512Maskable, appleTouchIcon] = await Promise.all([
    squareIcon(input, 192),
    squareIcon(input, 512),
    maskableIcon(input, 512),
    flattenedIcon(input, 180),
  ]);
  return { icon192, icon512, icon512Maskable, appleTouchIcon };
}
