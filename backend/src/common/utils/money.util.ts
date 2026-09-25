export const MONEY_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export const toMinorUnits = (amount: string): bigint => {
  const [whole, fraction = ''] = amount.split('.');
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};

export const formatDecimal = (value: string): string => {
  const minor = toMinorUnits(value);
  return `${minor / 100n}.${(minor % 100n).toString().padStart(2, '0')}`;
};
