import { getCookieName, signSessionToken } from '../../auth/jwt.js';
import { loadConfig } from '../../core/config/index.js';
import { jwtExpiresInToMs } from '../../core/config/jwtDuration.js';
import {
  activateBackupSuperadmin,
  getMePayload,
  issueInvite,
  loginWithPassword,
  registerFromInvite,
  registerTenant,
  resendVerification,
  updateMyProfile,
  upsertDevUser,
  verifyEmailAddress,
} from './auth.service.js';

export async function postDevLogin(req, res) {
  const config = loadConfig();
  if (config.env !== 'development') {
    return res.status(404).json({ error: 'NotFound', message: 'Not available' });
  }

  const user = await upsertDevUser(req.body);
  const tokenPayload = { sub: user.id, email: user.email };
  if (req.body?.tenantId) {
    tokenPayload.tenantId = String(req.body.tenantId);
  }
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

function issueSessionCookie(res, config, token) {
  const maxAge = jwtExpiresInToMs(config.auth.jwtExpiresIn);
  res.cookie(getCookieName(), token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.env === 'production',
    maxAge,
    path: '/',
  });
}

export async function postRegisterTenant(req, res) {
  const payload = await registerTenant(req.body);
  res.status(201).json(payload);
}

export async function postVerifyEmail(req, res) {
  const payload = await verifyEmailAddress(req.body?.token);
  res.status(200).json({
    verified: true,
    ...payload,
  });
}

export async function postResendVerification(req, res) {
  const payload = await resendVerification(req.body?.email);
  res.status(200).json(payload);
}

export async function postRegisterInvite(req, res) {
  const payload = await registerFromInvite(req.body);
  res.status(201).json(payload);
}

export async function postActivateBackup(req, res) {
  const payload = await activateBackupSuperadmin(req.body);
  res.status(200).json(payload);
}

export async function postInvite(req, res) {
  const workspaceId = req.workspace?.id;
  if (!workspaceId) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'X-Workspace-Id header is required',
    });
  }
  const tenantId = req.workspace?.tenantId;
  if (!tenantId) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Workspace is not tenant bound',
    });
  }
  const payload = await issueInvite({
    ...req.body,
    tenantId,
    workspaceId,
    inviterUserId: req.user.sub,
  });
  res.status(201).json(payload);
}

export async function postRegister(req, res) {
  return postRegisterTenant(req, res);
}

export async function postLogin(req, res) {
  const config = loadConfig();
  const { user, tenantId } = await loginWithPassword(req.body);
  const tokenPayload = {
    sub: user.id,
    email: user.email,
    tenantId,
  };
  if (user.systemAccount !== 'NONE') {
    tokenPayload.systemAccount = user.systemAccount;
  }
  const token = signSessionToken(tokenPayload);
  issueSessionCookie(res, config, token);

  res.status(200).json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      systemAccount: user.systemAccount,
      elevatedAccess: user.systemAccount !== 'NONE',
    },
    tenantId,
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

export async function getOnboardingStatus(req, res) {
  const payload = await getMePayload(req.user.sub);
  res.json({
    user: payload.user,
    tenants: payload.tenants,
  });
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
