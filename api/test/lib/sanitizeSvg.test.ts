import { describe, expect, it } from 'vitest';

import { sanitizeSvg } from '../../src/lib/sanitizeSvg.js';

describe('sanitizeSvg', () => {
  it('strips an embedded <script> tag', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="5" /></svg>';
    const result = sanitizeSvg(raw);
    expect(result).not.toContain('<script');
    expect(result).not.toContain('alert(1)');
  });

  it('strips an onload event-handler attribute', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><circle r="5" /></svg>';
    const result = sanitizeSvg(raw);
    expect(result).not.toContain('onload');
  });

  it('strips an onclick event-handler attribute on a nested element', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg"><circle r="5" onclick="alert(1)" /></svg>';
    const result = sanitizeSvg(raw);
    expect(result).not.toContain('onclick');
  });

  it('preserves harmless SVG markup', () => {
    const raw = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="5" fill="red" /></svg>';
    const result = sanitizeSvg(raw);
    expect(result).toContain('<circle');
    expect(result).toContain('fill="red"');
  });
});
