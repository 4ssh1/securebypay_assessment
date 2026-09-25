import { hmacSha256Hex, randomTokenHex, safeEqualHex, sha256Hex } from './crypto.util';

describe('crypto util', () => {
  it('generates 256-bit tokens that never repeat', () => {
    const a = randomTokenHex();
    expect(a).toHaveLength(64);
    expect(a).not.toBe(randomTokenHex());
  });

  it('hmac depends on the secret', () => {
    expect(hmacSha256Hex('secret-a', '123456')).not.toBe(hmacSha256Hex('secret-b', '123456'));
  });

  it('compares hashes safely, including mismatched lengths', () => {
    const hash = sha256Hex('x');
    expect(safeEqualHex(hash, hash)).toBe(true);
    expect(safeEqualHex(hash, sha256Hex('y'))).toBe(false);
    expect(safeEqualHex(hash, 'abcd')).toBe(false);
  });
});
