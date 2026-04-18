import { randomBytes } from 'node:crypto';
import { AppError } from '../core/utils/errors.js';

export const GOOGLE_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
];

const oauthStateStore = new Map();
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export function createOauthState(payload = null) {
  const state = randomBytes(24).toString('hex');
  oauthStateStore.set(state, {
    expiresAt: Date.now() + OAUTH_STATE_TTL_MS,
    payload,
  });
  return state;
}

export function validateAndConsumeOauthState(state) {
  const now = Date.now();
  for (const [k, value] of oauthStateStore.entries()) {
    if (value.expiresAt <= now) oauthStateStore.delete(k);
  }
  const stateEntry = oauthStateStore.get(state);
  if (!stateEntry || stateEntry.expiresAt <= now) {
    oauthStateStore.delete(state);
    return null;
  }
  oauthStateStore.delete(state);
  return stateEntry.payload ?? {};
}

export function buildGoogleAuthUrl(config, state) {
  if (
    !config.oauth.googleClientId ||
    !config.oauth.googleRedirectUri
  ) {
    throw new AppError(
      'Google OAuth is not configured',
      500,
      'ConfigError',
    );
  }

  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', config.oauth.googleClientId);
  url.searchParams.set('redirect_uri', config.oauth.googleRedirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  url.searchParams.set('access_type', 'offline');
  url.searchParams.set('prompt', 'consent');
  url.searchParams.set('state', state);
  return { authUrl: url.toString() };
}

export async function exchangeGoogleCodeForTokens(config, code) {
  if (
    !config.oauth.googleClientId ||
    !config.oauth.googleClientSecret ||
    !config.oauth.googleRedirectUri
  ) {
    throw new AppError('Google OAuth credentials are missing', 500, 'ConfigError');
  }

  const body = new URLSearchParams({
    code,
    client_id: config.oauth.googleClientId,
    client_secret: config.oauth.googleClientSecret,
    redirect_uri: config.oauth.googleRedirectUri,
    grant_type: 'authorization_code',
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new AppError(
      payload?.error_description || payload?.error || 'Failed to exchange Google auth code',
      401,
      'OAuthExchangeFailed',
    );
  }
  return payload;
}

export async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new AppError('Failed to read Google profile', 401, 'OAuthProfileFailed');
  }
  return payload;
}
