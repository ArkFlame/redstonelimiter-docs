/** Mirrors the shipped Java ActivityPolicy effective threshold rule. */
export function effectiveMaxActivations(base, presetMultiplier, tpsMultiplier) {
  if (!Number.isInteger(base) || base < 0) throw new RangeError('base must be a nonnegative integer');
  if (!Number.isFinite(presetMultiplier) || !Number.isFinite(tpsMultiplier)) throw new RangeError('multipliers must be finite');
  if (base === 0) return 0;
  return Math.max(1, Math.ceil(base * presetMultiplier * tpsMultiplier));
}

/** Mirrors shipped TpsScalingPolicy defaults: 16.0 -> 1x; 19.5 -> 2x. */
export function defaultTpsMultiplier(tps, enabled = true) {
  if (!enabled || tps === null || tps === undefined || !Number.isFinite(tps)) return 1;
  if (tps <= 16) return 1;
  if (tps >= 19.5) return 2;
  return 1 + (tps - 16) / 3.5;
}
