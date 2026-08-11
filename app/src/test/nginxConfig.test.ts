import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Regression test for nginx gzip_types configuration.
 *
 * Since nginx 1.21.3, the bundled mime.types maps .js files to text/javascript,
 * not application/javascript. Both app/nginx.conf.template and
 * infra/edge/default.conf.template must include text/javascript in their
 * gzip_types directive to ensure the main JS bundle is actually compressed.
 *
 * See task-1-brief.md for full context.
 */

describe('nginx gzip_types configuration', () => {
  it('app/nginx.conf.template includes text/javascript in gzip_types', () => {
    const appNginxPath = path.join(__dirname, '../../nginx.conf.template');
    const content = fs.readFileSync(appNginxPath, 'utf-8');

    // Extract the gzip_types line
    const gzipTypesMatch = content.match(/gzip_types\s+([^;]+);/);
    expect(gzipTypesMatch).toBeDefined();
    expect(gzipTypesMatch?.[1]).toBeDefined();

    const gzipTypes = gzipTypesMatch![1];

    // Verify text/javascript is present
    expect(gzipTypes).toContain('text/javascript');

    // Verify application/javascript is also kept for compatibility
    expect(gzipTypes).toContain('application/javascript');
  });

  it('infra/edge/default.conf.template includes text/javascript in gzip_types', () => {
    const edgeNginxPath = path.join(
      __dirname,
      '../../../infra/edge/default.conf.template'
    );
    const content = fs.readFileSync(edgeNginxPath, 'utf-8');

    // Extract the gzip_types line
    const gzipTypesMatch = content.match(/gzip_types\s+([^;]+);/);
    expect(gzipTypesMatch).toBeDefined();
    expect(gzipTypesMatch?.[1]).toBeDefined();

    const gzipTypes = gzipTypesMatch![1];

    // Verify text/javascript is present
    expect(gzipTypes).toContain('text/javascript');

    // Verify application/javascript is also kept for compatibility
    expect(gzipTypes).toContain('application/javascript');
  });
});

/**
 * Regression test for Cache-Control: immutable on hashed static assets.
 *
 * Vite emits every content-hashed JS/CSS/font/image file under
 * dist/assets/ (confirmed via a real `pnpm build`), so a request for one
 * of those files can be cached for a full year and marked immutable - the
 * hash in the filename guarantees the URL changes whenever the content
 * does. index.html and vite-plugin-pwa's service-worker files (sw.js,
 * workbox-*.js, registerSW.js) are all emitted at the site root, not under
 * /assets/, and must NOT get a long-lived Cache-Control header - blue/green
 * deploys depend on index.html being refetched every time to discover the
 * new deploy's asset hashes, and a stale-cached service worker could get
 * stuck and never pick up a new deploy.
 *
 * See task-2-brief.md for full context.
 */
describe('nginx Cache-Control for hashed static assets', () => {
  const appNginxPath = path.join(__dirname, '../../nginx.conf.template');
  const content = fs.readFileSync(appNginxPath, 'utf-8');

  it('adds an immutable, one-year Cache-Control header for /assets/ files', () => {
    // Extract the new location block matching Vite's hashed-output directory.
    const assetsBlockMatch = content.match(
      /location\s+~\*\s+\^\/assets\/[^{]+\{([^}]*)\}/
    );
    expect(assetsBlockMatch).toBeDefined();
    expect(assetsBlockMatch?.[0]).toBeDefined();

    const [fullBlock, blockBody] = assetsBlockMatch!;

    // The regex itself must be scoped to the /assets/ prefix (not "any .js
    // file anywhere"), which is what keeps it from ever matching the
    // service worker files below.
    expect(fullBlock).toMatch(/\^\/assets\//);

    // Covers the extensions Vite's real build output actually produces
    // today: .js, .css, .woff2 (fonts), .png (images) - plus a few common
    // static-asset extensions the codebase doesn't currently emit under
    // /assets/ but the regex is written to future-proof against (svg, gif,
    // ico, jpg/jpeg).
    for (const ext of ['js', 'css', 'woff2', 'png']) {
      expect(fullBlock).toMatch(new RegExp(`\\b${ext}\\b`));
    }

    expect(blockBody).toContain(
      'Cache-Control "public, max-age=31536000, immutable"'
    );

    // add_header does not inherit into a location block that declares its
    // own (this file's own comment on the server block explains why) - the
    // new block must repeat the full CSP/security-header set or it ships
    // without protection.
    expect(blockBody).toContain('Content-Security-Policy');
    expect(blockBody).toContain('X-Frame-Options "DENY"');
    expect(blockBody).toContain('X-Content-Type-Options "nosniff"');
    expect(blockBody).toContain(
      'Referrer-Policy "strict-origin-when-cross-origin"'
    );
  });

  it('does not match vite-plugin-pwa\'s service-worker files (root-level, not under /assets/)', () => {
    const assetsBlockMatch = content.match(
      /location\s+~\*\s+(\^\/assets\/\S+)\s+\{/
    );
    expect(assetsBlockMatch).toBeDefined();
    const regexSource = assetsBlockMatch![1]!;
    // Strip the nginx-style anchors/flags into a real JS regex - the
    // pattern captured is already anchored with ^ and $, case-insensitive
    // (~*), matching nginx's own semantics closely enough for this check.
    const jsRegex = new RegExp(regexSource, 'i');

    // Confirmed against a real `pnpm --filter app build`: these are the
    // exact filenames vite-plugin-pwa (workbox, generateSW mode) and Vite
    // itself emit at the site root, never under /assets/.
    const rootLevelFiles = [
      '/sw.js',
      '/workbox-9c191d2f.js',
      '/registerSW.js',
      '/index.html',
    ];

    for (const file of rootLevelFiles) {
      expect(jsRegex.test(file)).toBe(false);
    }

    // Sanity check the same regex on the real hashed-output path shape
    // Vite actually produced, so this test would fail if the location
    // block's prefix or extension list ever drifted from reality.
    const realAssetPaths = [
      '/assets/index-sgbHY4XI.js',
      '/assets/index-T21Xubac.css',
      '/assets/inter-latin-wght-normal-Dx4kXJAl.woff2',
      '/assets/bijou-CWr_1hgC.png',
    ];
    for (const assetPath of realAssetPaths) {
      expect(jsRegex.test(assetPath)).toBe(true);
    }
  });

  it('leaves index.html\'s location block without a long-lived Cache-Control header', () => {
    // The catch-all `location /` block (which serves index.html via
    // try_files) must stay exactly as-is - no Cache-Control directive at
    // all, let alone an immutable/long-lived one - so blue-green swaps are
    // discovered on the very next load.
    const catchAllMatch = content.match(/location\s+\/\s*\{([^}]*)\}/);
    expect(catchAllMatch).toBeDefined();
    const catchAllBody = catchAllMatch![1];

    expect(catchAllBody).not.toMatch(/Cache-Control/);
    expect(catchAllBody).toContain('try_files $uri /index.html');
  });
});
