export enum DashboardPeriod {
  THIS_MONTH = 'this_month',
  LAST_MONTH = 'last_month',
  THIS_YEAR = 'this_year',
}

export enum GrowthGranularity {
  YEAR = 'year',
  MONTH = 'month',
  WEEK = 'week',
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface GrowthWindow extends DateRange {
  unit: 'month' | 'day';
  buckets: string[];
}

const utc = (year: number, month: number, day = 1): Date => new Date(Date.UTC(year, month, day));

const bucketKey = (date: Date): string => date.toISOString().slice(0, 10);

export const resolvePeriod = (
  period: DashboardPeriod,
  now: Date = new Date(),
): { current: DateRange; previous: DateRange } => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  switch (period) {
    case DashboardPeriod.THIS_YEAR:
      return {
        current: { from: utc(year, 0), to: utc(year + 1, 0) },
        previous: { from: utc(year - 1, 0), to: utc(year, 0) },
      };
    case DashboardPeriod.LAST_MONTH:
      return {
        current: { from: utc(year, month - 1), to: utc(year, month) },
        previous: { from: utc(year, month - 2), to: utc(year, month - 1) },
      };
    case DashboardPeriod.THIS_MONTH:
    default:
      return {
        current: { from: utc(year, month), to: utc(year, month + 1) },
        previous: { from: utc(year, month - 1), to: utc(year, month) },
      };
  }
};

export const resolveGrowthWindow = (
  granularity: GrowthGranularity,
  now: Date = new Date(),
): GrowthWindow => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (granularity === GrowthGranularity.YEAR) {
    const buckets = Array.from({ length: 12 }, (_, i) => bucketKey(utc(year, i)));
    return { from: utc(year, 0), to: utc(year + 1, 0), unit: 'month', buckets };
  }

  if (granularity === GrowthGranularity.MONTH) {
    const from = utc(year, month);
    const to = utc(year, month + 1);
    const days = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    const buckets = Array.from({ length: days }, (_, i) => bucketKey(utc(year, month, i + 1)));
    return { from, to, unit: 'day', buckets };
  }

  const offsetFromMonday = (now.getUTCDay() + 6) % 7;
  const from = utc(year, month, now.getUTCDate() - offsetFromMonday);
  const to = utc(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + 7);
  const buckets = Array.from({ length: 7 }, (_, i) =>
    bucketKey(utc(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + i)),
  );
  return { from, to, unit: 'day', buckets };
};
