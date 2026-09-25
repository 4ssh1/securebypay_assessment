import { buildKpi } from './kpi.util';

describe('buildKpi', () => {
  it('computes percentage change to one decimal', () => {
    expect(buildKpi(34, 18)).toEqual({ count: 34, previousCount: 18, changePercent: 88.9 });
  });

  it('reports a decrease as negative', () => {
    expect(buildKpi(5, 10).changePercent).toBe(-50);
  });

  it('avoids dividing by zero', () => {
    expect(buildKpi(4, 0).changePercent).toBeNull();
  });
});
