/**
 * Copies `text` to the clipboard via the standard Clipboard API. Rejects if
 * the browser denies/lacks clipboard access (e.g. no user gesture, insecure
 * context, permission denied) - callers decide how to surface that.
 */
export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}
