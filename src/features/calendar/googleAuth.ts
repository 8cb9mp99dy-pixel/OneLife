// Google OAuth for the calendar screen, done as a plain top-level redirect
// (implicit token flow) — no server, no SDK script, no new dependency.
// Google mints access tokens that last ~1 hour and this flow has no refresh
// token, so "reconnect" after expiry is an expected, one-tap state.
//
// Everything here lives in localStorage, not Dexie/Supabase: it's a cache
// of a Google-owned session, same eviction rules as the rest of local
// storage on iOS — losing it just means tapping Connect again.

const CLIENT_ID_KEY = 'gcal_client_id';
const TOKEN_KEY = 'gcal_token';
const STATE_KEY = 'gcal_oauth_state';

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

type StoredToken = { access_token: string; expires_at: number };

function redirectUri(): string {
  return window.location.origin + import.meta.env.BASE_URL;
}

export function getClientId(): string | null {
  return localStorage.getItem(CLIENT_ID_KEY);
}

export function setClientId(clientId: string): void {
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

export function getAccessToken(): string | null {
  const raw = localStorage.getItem(TOKEN_KEY);
  if (!raw) return null;
  try {
    const token = JSON.parse(raw) as StoredToken;
    // 60s safety margin so a request never starts with an about-to-expire token.
    if (Date.now() > token.expires_at - 60_000) return null;
    return token.access_token;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function disconnect(): void {
  clearToken();
  localStorage.removeItem(CLIENT_ID_KEY);
}

export function startConnect(): void {
  const clientId = getClientId();
  if (!clientId) return;

  const state = crypto.getRandomValues(new Uint32Array(4)).join('-');
  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri(),
    response_type: 'token',
    scope: SCOPE,
    state,
  });
  window.location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

// Must run at app start, BEFORE anything touches location.hash — the app's
// own hash-based screen switching would otherwise clobber the token that
// Google returns in the URL fragment. Called from main.tsx, ahead of render.
export function captureTokenFromUrl(): void {
  const hash = window.location.hash;
  if (!hash.includes('access_token=')) return;

  const params = new URLSearchParams(hash.slice(1));
  const accessToken = params.get('access_token');
  const expiresIn = Number(params.get('expires_in') ?? '3600');
  const state = params.get('state');

  const expectedState = sessionStorage.getItem(STATE_KEY);
  sessionStorage.removeItem(STATE_KEY);

  // Strip the token from the URL either way — it shouldn't linger in
  // history or get mistaken for a screen name by the hash router.
  window.history.replaceState(null, '', window.location.pathname + '#calendar');

  if (!accessToken || !state || state !== expectedState) return;

  const token: StoredToken = {
    access_token: accessToken,
    expires_at: Date.now() + expiresIn * 1000,
  };
  localStorage.setItem(TOKEN_KEY, JSON.stringify(token));
}
