export type MomTrend = {
  value: string;
  isPositive: boolean;
};

/**
 * Month-over-month trend for dashboard StatCards.
 * Omits when both periods are zero; uses "New" when prior was zero.
 */
export function computeMomTrend(
  current: number,
  previous: number,
): MomTrend | undefined {
  if (current === 0 && previous === 0) return undefined;
  if (previous === 0 && current > 0) {
    return { value: "New", isPositive: true };
  }
  const pct = ((current - previous) / previous) * 100;
  return {
    value: `${Math.abs(pct).toFixed(1)}% MoM`,
    isPositive: pct >= 0,
  };
}
