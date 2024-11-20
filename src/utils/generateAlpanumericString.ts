import crypto from 'crypto';

export function generateAlphanumericString(length: number): string {
  const bytes = crypto.randomBytes(length);
  return bytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
}