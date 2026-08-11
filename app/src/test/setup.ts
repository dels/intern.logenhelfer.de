import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup, configure } from '@testing-library/react';
import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

// ponytail: default findBy*/waitFor timeout (1000ms) is a separate clock from
// vite.config.ts's testTimeout bump above - raising testTimeout doesn't help
// a findByRole that throws its own timeout first. routes.test.tsx's lazy-page
// test does a real dynamic import() + auth bootstrap before the heading
// appears, which fits under 1000ms alone but not under bin/test-gate's
// full-suite CPU contention (--cpus 8 shared across every parallel worker) -
// confirmed by reproducing the deploy failures on both fwze and next hosts
// 2026-08-11: the exact same test flakes under the full suite, passes
// reliably standalone. 5s gives headroom without hiding a genuine hang.
configure({ asyncUtilTimeout: 5000 });

// jsdom's test environment installs its own File/Blob constructors on
// globalThis, shadowing Node's native (undici-backed) ones. MSW's node
// interceptor parses multipart bodies through undici, which brand-checks
// FormData values with `webidl.is.File` - a jsdom File instance fails that
// check and undici throws, which MSW then reports as a 500. Restoring
// Node's own File/Blob classes here means `new File(...)` in tests produces
// an instance undici actually recognizes.
globalThis.File = NodeFile as unknown as typeof globalThis.File;
globalThis.Blob = NodeBlob as unknown as typeof globalThis.Blob;

// jsdom does not implement window.matchMedia. MUI's useMediaQuery relies on it,
// so without a polyfill breakpoint queries always report "no match" and
// components render their mobile branch during tests. Default to "matches"
// so tests exercise the desktop layout unless a test overrides this mock.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: true,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});

// jsdom does not implement URL.createObjectURL/revokeObjectURL. The
// downloadFile helper (src/api/client.ts) relies on both to turn a fetched
// Blob into a clickable, named download - without this stub, any test that
// exercises the real download path throws "URL.createObjectURL is not a
// function" instead of testing the intended behavior.
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = () => 'blob:mock-url';
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = () => {};
}

afterEach(() => {
  cleanup();
});

// The default reporter swallows console.error, so an act() warning (a state
// update against a mounted component outside act()) can sit in a test file
// for months without failing CI. Promote it to a thrown error so it can't
// silently regress again.
const originalConsoleError = console.error;
console.error = (...args: Parameters<typeof console.error>) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('not wrapped in act')) {
    throw new Error(message);
  }
  originalConsoleError(...args);
};
