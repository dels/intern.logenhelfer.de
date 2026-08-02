// Shared countdown/auto-reload script for the 500/502 error pages
// (app/public/errors/500.html, app/public/errors/502.html).
//
// Must be an external, same-origin script: this app's CSP is
// `script-src 'self'` (see app/nginx.conf.template), so an inline <script>
// would be blocked.
//
// The Fibonacci-index logic below is intentionally a duplicate of the pure
// functions in app/src/features/errors/fibRetry.ts (tested there via
// fibRetry.test.ts). Files under app/public/ are copied verbatim into the
// nginx image, never passed through Vite/tsc, so this file can't import
// from src/ — duplicating ~5 lines here is the pragmatic tradeoff instead of
// building tooling to bundle a public/ script. If the sequence/cap logic
// ever changes, update both places.
(function () {
  var STORAGE_KEY = 'errorPageRetryIndex';
  var FIB_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
  var MAX_INDEX = 8; // FIB_SEQUENCE[8] === 55, the largest term <= ~60s.

  function fibonacci(index) {
    var clamped = Math.max(0, Math.min(index, MAX_INDEX));
    return FIB_SEQUENCE[clamped];
  }

  function nextFibDelay(index) {
    var safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
    var delay = fibonacci(safeIndex);
    var nextIndex = Math.min(safeIndex + 1, MAX_INDEX);
    return { delay: delay, nextIndex: nextIndex };
  }

  function readIndex() {
    var raw = window.sessionStorage.getItem(STORAGE_KEY);
    var parsed = raw === null ? 0 : parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  }

  function start() {
    var el = document.getElementById('countdown');
    if (!el) return;

    var index = readIndex();
    var result = nextFibDelay(index);
    var remaining = result.delay;

    // Persist the next index now, before the countdown runs — a reload wipes
    // all JS state, so this is the only chance to write it for next time.
    window.sessionStorage.setItem(STORAGE_KEY, String(result.nextIndex));

    function render() {
      el.textContent = 'Aktualisiere die Seite in ' + remaining + ' Sekunden...';
    }

    render();
    var timer = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearInterval(timer);
        window.location.reload();
        return;
      }
      render();
    }, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
