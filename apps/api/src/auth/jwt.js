import jwt from 'jsonwebtoken';
import { loadConfig } from '../core/config/index.js';

const COOKIE_NAME = 'beastops_session';

export function getCookieName() {
  return COOKIE_NAME;
}

export function signSessionToken(payload, options = {}) {
  const { auth } = loadConfig();
  return jwt.sign(payload, auth.jwtSecret, {
    expiresIn: auth.jwtExpiresIn,
    ...options,
  });
}

export function verifySessionToken(token) {
  const { auth } = loadConfig();
  return jwt.verify(token, auth.jwtSecret);
}
