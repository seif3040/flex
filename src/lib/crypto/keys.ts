import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

function secret() {
  const value = process.env.KEY_ENCRYPTION_SECRET;
  if (!value || !/^[0-9a-fA-F]{64}$/.test(value)) throw new Error('KEY_ENCRYPTION_SECRET must be a 64-character hex string');
  return Buffer.from(value, 'hex');
}

export function encryptKey(plaintext: string): string {
  if (!plaintext) throw new Error('Cannot encrypt an empty key');
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, secret(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function decryptKey(ciphertext: string): string {
  const [ivPart, tagPart, dataPart] = ciphertext.split('.');
  if (!ivPart || !tagPart || !dataPart) throw new Error('Invalid encrypted key format');
  const decipher = createDecipheriv(ALGORITHM, secret(), Buffer.from(ivPart, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataPart, 'base64url')), decipher.final()]).toString('utf8');
}
