const SESSION_KEY = "vora.session_id";
const CLIENT_KEY = "vora.client_id";
const DISPLAY_NAME_KEY = "vora.display_name";
const TASTE_SETUP_DISMISSED_KEY = "vora.taste_setup_dismissed";

function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function readOrCreate(key: string, prefix: string): string {
  if (typeof window === "undefined") return createId(prefix);
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;
  const next = createId(prefix);
  window.localStorage.setItem(key, next);
  return next;
}

export function getSessionId(): string {
  return readOrCreate(SESSION_KEY, "session");
}

export function getClientId(): string {
  return readOrCreate(CLIENT_KEY, "client");
}

export function getDisplayName(): string {
  if (typeof window === "undefined") return "Guest";
  return window.localStorage.getItem(DISPLAY_NAME_KEY) || "Guest";
}

export function setDisplayName(name: string): void {
  if (typeof window === "undefined") return;
  const cleaned = name.trim() || "Guest";
  window.localStorage.setItem(DISPLAY_NAME_KEY, cleaned);
}

export function tasteSetupDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(TASTE_SETUP_DISMISSED_KEY) === "true";
}

export function setTasteSetupDismissed(value: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASTE_SETUP_DISMISSED_KEY, String(value));
}
