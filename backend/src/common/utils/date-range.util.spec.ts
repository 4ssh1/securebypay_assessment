import { DashboardPeriod, GrowthGranularity, resolveGrowthWindow, resolvePeriod } from './date-range.util';

const NOW = new Date(Date.UTC(2026, 8, 24, 10, 0, 0));

describe('resolvePeriod', () => {
  it('this month compares against the previous calendar month', () => {
    const { current, previous } = resolvePeriod(DashboardPeriod.THIS_MONTH, NOW);
    expect(current.from.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(current.to.toISOString()).toBe('2026-10-01T00:00:00.000Z');
    expect(previous.from.toISOString()).toBe('2026-08-01T00:00:00.000Z');
  });

  it('handles the January boundary', () => {
    const { previous } = resolvePeriod(DashboardPeriod.THIS_MONTH, new Date(Date.UTC(2026, 0, 15)));
    expect(previous.from.toISOString()).toBe('2025-12-01T00:00:00.000Z');
  });

  it('this year compares against the previous year', () => {
    const { current, previous } = resolvePeriod(DashboardPeriod.THIS_YEAR, NOW);
    expect(current.from.getUTCFullYear()).toBe(2026);
    expect(previous.from.getUTCFullYear()).toBe(2025);
  });
});

describe('resolveGrowthWindow', () => {
  it('year has 12 monthly buckets', () => {
    const window = resolveGrowthWindow(GrowthGranularity.YEAR, NOW);
    expect(window.buckets).toHaveLength(12);
    expect(window.buckets[0]).toBe('2026-01-01');
    expect(window.unit).toBe('month');
  });

  it('month has one bucket per day', () => {
    expect(resolveGrowthWindow(GrowthGranularity.MONTH, NOW).buckets).toHaveLength(30);
  });

  it('week starts on Monday and spans 7 days', () => {
    const window = resolveGrowthWindow(GrowthGranularity.WEEK, NOW);
    expect(window.buckets).toHaveLength(7);
    expect(window.buckets[0]).toBe('2026-09-21');
    expect(window.buckets[6]).toBe('2026-09-27');
  });

  it('week crossing a month boundary stays contiguous', () => {
    const window = resolveGrowthWindow(GrowthGranularity.WEEK, new Date(Date.UTC(2026, 9, 1)));
    expect(window.buckets[0]).toBe('2026-09-28');
    expect(window.buckets[6]).toBe('2026-10-04');
  });
});
