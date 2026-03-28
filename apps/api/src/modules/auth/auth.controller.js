import { getCookieName, signSessionToken } from '../../auth/jwt.js';
import { loadConfig } from '../../core/config/index.js';
import { jwtExpiresInToMs } from '../../core/config/jwtDuration.js';
import { getMePayload, updateMyProfile, upsertDevUser } from './auth.service.js';

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
