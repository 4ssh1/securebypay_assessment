import { Transform } from 'class-transformer';

const mapString = (fn: (value: string) => string) =>
  Transform(({ value }) => (typeof value === 'string' ? fn(value) : value));

export const Trim = () => mapString((v) => v.trim());
export const NormalizeEmail = () => mapString((v) => v.trim().toLowerCase());
export const StripPhoneFormatting = () => mapString((v) => v.replace(/[\s().-]/g, ''));
