export interface KpiMetric {
  count: number;
  previousCount: number;
  changePercent: number | null;
}

export const buildKpi = (count: number, previousCount: number): KpiMetric => ({
  count,
  previousCount,
  changePercent: previousCount === 0 ? null : Math.round(((count - previousCount) / previousCount) * 1000) / 10,
});
