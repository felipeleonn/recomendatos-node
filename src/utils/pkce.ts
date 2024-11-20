import crypto from 'crypto';

/**
 * Genera un code_verifier aleatorio.
 * @returns Un string base64url seguro de 43-128 caracteres.
 */
export const generateCodeVerifier = (): string => {
  return base64URLEncode(crypto.randomBytes(32));
};

/**
 * Genera un code_challenge a partir del code_verifier usando SHA256.
 * @param codeVerifier El code_verifier generado.
 * @returns El code_challenge correspondiente.
 */
export const generateCodeChallenge = (codeVerifier: string): string => {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return base64URLEncode(hash);
};

/**
 * Codifica los bytes en base64url sin padding.
 * @param buffer El buffer de bytes a codificar.
 * @returns El string codificado en base64url.
 */
const base64URLEncode = (buffer: Buffer): string => {
  return buffer
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
};