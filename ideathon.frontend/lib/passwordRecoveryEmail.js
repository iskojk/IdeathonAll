const STORAGE_KEY = 'afz:password-reset-email';
const LIFETIME_MS = 15 * 60 * 1000;

export function normalizeRecoveryEmail(value) {
  return typeof value === 'string' && value.length <= 254 ? value.trim().toLowerCase() : '';
}

// Keep only the requested address, never a reset code or password.
export function rememberRecoveryEmail(value) {
  const email = normalizeRecoveryEmail(value);
  if (!email || typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ email, expiresAt: Date.now() + LIFETIME_MS }));
  } catch { /* The URL still carries the address when storage is unavailable. */ }
}

export function readRecoveryEmail() {
  if (typeof window === 'undefined') return '';
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && Number.isFinite(saved.expiresAt) && saved.expiresAt > Date.now()) {
      return normalizeRecoveryEmail(saved.email);
    }
    sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Storage may be unavailable. */ }
  return '';
}

export function clearRecoveryEmail(value) {
  if (typeof window === 'undefined') return;
  try {
    if (readRecoveryEmail() === normalizeRecoveryEmail(value)) sessionStorage.removeItem(STORAGE_KEY);
  } catch { /* Recovery success must not depend on browser storage. */ }
}
