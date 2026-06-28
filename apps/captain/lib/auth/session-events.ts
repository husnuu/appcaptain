import { setAccessToken } from "./token-store";

type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Clears the in-memory token and notifies auth UI to reset. */
export function notifySessionExpired(): void {
  setAccessToken(null);
  for (const listener of listeners) listener();
}
