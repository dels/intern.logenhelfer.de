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
