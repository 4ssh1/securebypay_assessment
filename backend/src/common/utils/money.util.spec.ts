import { formatDecimal, MONEY_PATTERN, toMinorUnits } from './money.util';

describe('money util', () => {
  it('converts decimal strings to minor units without float math', () => {
    expect(toMinorUnits('3000000.28')).toBe(300000028n);
    expect(toMinorUnits('0.1')).toBe(10n);
    expect(toMinorUnits('5')).toBe(500n);
  });

  it('normalises decimals to two places', () => {
    expect(formatDecimal('0')).toBe('0.00');
    expect(formatDecimal('12.5')).toBe('12.50');
  });

  it('accepts only up to two decimal places', () => {
    expect(MONEY_PATTERN.test('10.99')).toBe(true);
    expect(MONEY_PATTERN.test('10.999')).toBe(false);
    expect(MONEY_PATTERN.test('-5')).toBe(false);
    expect(MONEY_PATTERN.test('1e3')).toBe(false);
  });
});
