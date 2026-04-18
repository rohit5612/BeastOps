import {
  buildGoogleAuthUrl,
  createOauthState,
  exchangeGoogleCodeForTokens,
  fetchGoogleProfile,
  validateAndConsumeOauthState,
} from '../../auth/google.js';
import { loadConfig } from '../../core/config/index.js';
import { AppError } from '../../core/utils/errors.js';
import {
  assertAdminCanManageWorkspaceIntegration,
  getYouTubeIntegrationStatus,
  linkGoogleIntegrationForWorkspace,
} from './integrations.service.js';

export async function getYouTubeStatus(req, res) {
  const status = await getYouTubeIntegrationStatus(req.workspace.id);
  res.json(status);
}

export async function getYouTubeConnectStart(req, res) {
  const config = loadConfig();
  const workspaceId = String(req.query?.workspaceId || '').trim();
  const userId = req.user.sub;
  if (!workspaceId) {
    throw new AppError('workspaceId is required', 400, 'ValidationError');
  }
  await assertAdminCanManageWorkspaceIntegration(userId, workspaceId);

  const state = createOauthState({
    workspaceId,
    userId,
  });
  const { authUrl } = buildGoogleAuthUrl(config, state);
  res.redirect(authUrl);
}

export async function getYouTubeConnectCallback(req, res) {
  const config = loadConfig();
  const code = String(req.query?.code || '');
  const state = String(req.query?.state || '');

  if (!code || !state) {
    throw new AppError('Missing OAuth callback parameters', 400, 'OAuthStateInvalid');
  }

  const oauthContext = validateAndConsumeOauthState(state);
  if (!oauthContext?.workspaceId || !oauthContext?.userId) {
    throw new AppError('Invalid OAuth state', 400, 'OAuthStateInvalid');
  }

  const tokens = await exchangeGoogleCodeForTokens(config, code);
  const profile = await fetchGoogleProfile(tokens.access_token);

  await linkGoogleIntegrationForWorkspace({
    workspaceId: oauthContext.workspaceId,
    userId: oauthContext.userId,
    providerAccountId: profile.id,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresInSec: tokens.expires_in,
  });

  const redirectBase = config.frontend.url || '/';
  const qs = new URLSearchParams({
    workspaceId: oauthContext.workspaceId,
    youtube: 'connected',
  });
  res.redirect(`${redirectBase}/integrations?${qs.toString()}`);
}
