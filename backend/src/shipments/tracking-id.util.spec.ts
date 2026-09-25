import { generateTrackingId } from './tracking-id.util';

describe('generateTrackingId', () => {
  it('matches the MAF-###-###-### shape', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateTrackingId()).toMatch(/^MAF-\d{3}-\d{3}-\d{3}$/);
    }
  });

  it('varies across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, generateTrackingId));
    expect(ids.size).toBeGreaterThan(1);
  });
});
