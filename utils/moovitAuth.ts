import { createHmac, randomBytes } from 'node:crypto';

export type MoovitHmacEncoding = 'hex' | 'base64';

export interface MoovitHmacInput {
  secret: string;
  payload?: string;
  timestamp?: number;
  nonce?: string;
  encoding?: MoovitHmacEncoding;
}

export interface MoovitHmacAuthorization {
  authorization: string;
  signature: string;
  nonce: string;
  timestamp: number;
}

export function createMoovitNonce(length = 255): string {
  if (!Number.isInteger(length) || length < 32 || length > 512) {
    throw new Error('Moovit nonce length must be between 32 and 512 characters');
  }
  return randomBytes(Math.ceil((length * 3) / 4) + 2).toString('base64url').slice(0, length);
}

export function createMoovitHmacAuthorization(input: MoovitHmacInput): MoovitHmacAuthorization {
  const secret = input.secret.trim();
  if (!secret) throw new Error('Moovit API secret is required for HMAC authentication');

  const timestamp = input.timestamp ?? Date.now();
  if (!Number.isSafeInteger(timestamp) || timestamp <= 0) {
    throw new Error('Moovit HMAC timestamp must be a positive integer');
  }

  const nonce = input.nonce ?? createMoovitNonce();
  if (!nonce || nonce.includes(':')) throw new Error('Moovit HMAC nonce is invalid');

  const payload = input.payload ?? '';
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}:${payload}:${nonce}`, 'utf8')
    .digest(input.encoding ?? 'hex');

  return {
    authorization: `hmacauth ${signature}:${nonce}:${timestamp}`,
    signature,
    nonce,
    timestamp,
  };
}
