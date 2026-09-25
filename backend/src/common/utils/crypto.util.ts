import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export const sha256Hex = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const hmacSha256Hex = (secret: string, value: string): string =>
  createHmac('sha256', secret).update(value).digest('hex');

export const randomTokenHex = (bytes = 32): string => randomBytes(bytes).toString('hex');

export const safeEqualHex = (a: string, b: string): boolean => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  return left.length === right.length && timingSafeEqual(left, right);
};
