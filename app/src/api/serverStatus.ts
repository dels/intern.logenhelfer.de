type Listener = (down: boolean) => void;

let down = false;
const listeners = new Set<Listener>();

// subscribe() immediately replays the current state to a new listener -
// a component mounting after a failure already happened (e.g. a slow
// initial page load) must not have to wait for the *next* event to know
// the server is currently unreachable.
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  listener(down);
  return () => listeners.delete(listener);
}

export function reportFailure(): void {
  if (down) return;
  down = true;
  listeners.forEach((listener) => listener(down));
}

export function reportSuccess(): void {
  if (!down) return;
  down = false;
  listeners.forEach((listener) => listener(down));
}

// Test-only: module state otherwise persists across tests in the same file.
export function resetServerStatus(): void {
  down = false;
}
