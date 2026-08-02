import { JSDOM } from 'jsdom';
import createDOMPurify from 'dompurify';

/**
 * Sanitizes an uploaded SVG's raw bytes before they're ever stored - GET
 * /api/v1/public/logo later serves stored bytes verbatim with
 * Content-Type: image/svg+xml, and a browser navigated directly to that URL
 * (unlike an <img src="...svg">, which never executes embedded script)
 * executes any <script>/on* handler an SVG document contains. Sanitizing at
 * upload time means the stored bytes are safe regardless of how they're ever
 * served later, not just for today's serving path.
 *
 * DOMPurify needs a DOM to operate against; jsdom supplies a minimal one for
 * this server-side (non-browser) use, per DOMPurify's own documented Node.js
 * usage pattern.
 */
export function sanitizeSvg(raw: string): string {
  const { window } = new JSDOM('');
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'foreignObject'],
  });
}
