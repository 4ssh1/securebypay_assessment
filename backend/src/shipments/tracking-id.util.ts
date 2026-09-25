import { randomInt } from 'crypto';

export const generateTrackingId = (): string => {
  const part = () => String(randomInt(100, 1000));
  return `MAF-${part()}-${part()}-${part()}`;
};
