import { useSyncExternalStore } from 'react';

interface PwaState {
  updateAvailable: boolean;
  offline: boolean;
}

let state: PwaState = {
  updateAvailable: false,
  offline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
};

const listeners = new Set<() => void>();
let pendingWorker: ServiceWorker | null = null;
let registration: ServiceWorkerRegistration | undefined;
let initialised = false;
let refreshAccepted = false;
let reloading = false;

function emit(patch: Partial<PwaState>) {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

function surfaceUpdate(worker: ServiceWorker) {
  pendingWorker = worker;
  emit({ updateAvailable: true });
}

export function initPwa(): void {
  if (initialised) return;
  initialised = true;

  window.addEventListener('online', () => emit({ offline: false }));
  window.addEventListener('offline', () => emit({ offline: true }));

  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshAccepted || reloading) return;
    reloading = true;
    location.reload();
  });

  const register = () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' })
      .then((reg) => {
        registration = reg;

        if (reg.waiting && navigator.serviceWorker.controller) {
          surfaceUpdate(reg.waiting);
        }

        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          if (!worker) return;

          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              surfaceUpdate(worker);
            }
          });
        });

        void reg.update().catch(() => {});

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState !== 'visible') return;
          void reg.update().catch(() => {});
          if (reg.waiting && navigator.serviceWorker.controller) surfaceUpdate(reg.waiting);
        });
      })
      .catch(() => {});
  };

  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register, { once: true });
}

export function acceptUpdate(): void {
  refreshAccepted = true;
  try {
    pendingWorker?.postMessage({ type: 'SKIP_WAITING' });
  } catch {
    // Fallback reload below still guarantees the user tap has an effect.
  }

  setTimeout(() => {
    if (!reloading) {
      reloading = true;
      location.reload();
    }
  }, 1500);
}

export async function checkForUpdate(): Promise<void> {
  try {
    await registration?.update();
  } catch {
    // Harmless while offline or during a transient deployment window.
  }
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): PwaState {
  return state;
}

export function usePwa(): PwaState & {
  acceptUpdate: typeof acceptUpdate;
  checkForUpdate: typeof checkForUpdate;
} {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return { ...snapshot, acceptUpdate, checkForUpdate };
}
