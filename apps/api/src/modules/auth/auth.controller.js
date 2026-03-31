import {
  buildGoogleAuthUrl,
  createOauthState,
  exchangeGoogleCodeForTokens,
  fetchGoogleProfile,
  validateAndConsumeOauthState,
} from '../../auth/google.js';
import { getCookieName, signSessionToken } from '../../auth/jwt.js';
import { loadConfig } from '../../core/config/index.js';
import { jwtExpiresInToMs } from '../../core/config/jwtDuration.js';
import {
  getMePayload,
  updateMyProfile,
  upsertDevUser,
  upsertGoogleUserAndAccount,
} from './auth.service.js';

export async function postDevLogin(req, res) {
  const config = loadConfig();
  if (config.env !== 'development') {
    return res.status(404).json({ error: 'NotFound', message: 'Not available' });
  }

  const user = await upsertDevUser(req.body);
  const tokenPayload = { sub: user.id, email: user.email };
  if (user.systemAccount !== 'NONE') {
    tokenPayload.systemAccount = user.systemAccount;
  }
  const token = signSessionToken(tokenPayload);
  const maxAge = jwtExpiresInToMs(config.auth.jwtExpiresIn);

  res.cookie(getCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge,
    path: '/',
  });

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      systemAccount: user.systemAccount,
      elevatedAccess: user.systemAccount !== 'NONE',
    },
  });
}

export async function postLogout(req, res) {
  const { env } = loadConfig();
  res.clearCookie(getCookieName(), {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: env === 'production',
  });
  res.status(204).end();
}

export async function getMe(req, res) {
  const payload = await getMePayload(req.user.sub);
  res.json(payload);
}

export async function patchMe(req, res) {
  const user = await updateMyProfile(req.user.sub, req.body);
  res.json({
    user: {
      ...user,
      elevatedAccess: user.systemAccount !== 'NONE',
    },
  });
}

export async function getGoogleAuthStart(req, res) {
  const config = loadConfig();
  const state = createOauthState();
  const { authUrl } = buildGoogleAuthUrl(config, state);

  res.cookie('beastops_oauth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge: 10 * 60 * 1000,
    path: '/api/auth',
  });

  res.redirect(authUrl);
}

export async function getGoogleAuthCallback(req, res) {
  const config = loadConfig();
  const { code, state } = req.query;
  const cookieState = req.cookies?.beastops_oauth_state;
  const stateFromQuery = state ? String(state) : '';
  const validFromCookie =
    !!cookieState && stateFromQuery && String(cookieState) === stateFromQuery;
  const validFromStore =
    !!stateFromQuery && validateAndConsumeOauthState(stateFromQuery);
  if (!code || !stateFromQuery || (!validFromCookie && !validFromStore)) {
    return res.status(400).json({
      error: 'OAuthStateInvalid',
      message: 'Invalid OAuth state',
    });
  }

  const tokens = await exchangeGoogleCodeForTokens(config, String(code));
  const profile = await fetchGoogleProfile(tokens.access_token);

  const user = await upsertGoogleUserAndAccount({
    providerAccountId: profile.id,
    email: profile.email,
    name: profile.name,
    imageUrl: profile.picture,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresInSec: tokens.expires_in,
  });

  const tokenPayload = { sub: user.id, email: user.email };
  if (user.systemAccount !== 'NONE') {
    tokenPayload.systemAccount = user.systemAccount;
  }
  const token = signSessionToken(tokenPayload);
  const maxAge = jwtExpiresInToMs(config.auth.jwtExpiresIn);

  res.clearCookie('beastops_oauth_state', {
    path: '/api/auth',
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
  });
  res.cookie(getCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge,
    path: '/',
  });

  res.redirect(config.frontend.url || '/');
}
