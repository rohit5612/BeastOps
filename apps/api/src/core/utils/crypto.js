import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { loadConfig } from '../config/index.js';

const ALGO = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey() {
  const { auth, env } = loadConfig();
  if (!auth.tokenEncryptionKey) {
    if (env === 'production') {
      throw new Error('TOKEN_ENCRYPTION_KEY is required in production');
    }
    return createHash('sha256').update(auth.jwtSecret).digest();
  }

  const raw = auth.tokenEncryptionKey;
  let asBuffer = null;
  if (/^[a-f0-9]{64}$/i.test(raw)) {
    asBuffer = Buffer.from(raw, 'hex');
  } else {
    try {
      asBuffer = Buffer.from(raw, 'base64');
    } catch {
      asBuffer = null;
    }
  }

  if (asBuffer && asBuffer.length === 32) {
    return asBuffer;
  }

  if (env === 'production') {
    throw new Error(
      'TOKEN_ENCRYPTION_KEY must be 64-char hex or base64 that decodes to 32 bytes',
    );
  }

  // Dev fallback: avoid local OAuth crashes from malformed key format.
  // eslint-disable-next-line no-console
  console.warn(
    '[crypto] Invalid TOKEN_ENCRYPTION_KEY format; using SHA-256 derived dev key',
  );
  return createHash('sha256').update(raw).digest();
}

export function encryptSecret(plainText) {
  if (!plainText) return null;
  const key = getKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(encoded) {
  if (!encoded) return null;
  const [ivB64, tagB64, dataB64] = String(encoded).split('.');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format');
  }
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const plain = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return plain.toString('utf8');
}
