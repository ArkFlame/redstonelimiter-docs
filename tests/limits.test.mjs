import test from 'node:test';
import assert from 'node:assert/strict';
import { effectiveMaxActivations, defaultTpsMultiplier } from '../src/lib/limitMath.mjs';

test('zero means unlimited, not zero allowed', () => {
  assert.equal(effectiveMaxActivations(0, 2, 2), 0);
});
test('STRICT, degraded TPS, piston base 3 yields 3', () => {
  assert.equal(effectiveMaxActivations(3, 1, defaultTpsMultiplier(16)), 3);
});
test('STRICT, healthy TPS, piston base 3 yields 6', () => {
  assert.equal(effectiveMaxActivations(3, 1, defaultTpsMultiplier(19.5)), 6);
});
test('BALANCED rounds up', () => {
  assert.equal(effectiveMaxActivations(3, 1.5, 1), 5);
});
test('default intermediate TPS uses linear interpolation', () => {
  assert.equal(defaultTpsMultiplier(17.75), 1.5);
});
test('missing TPS uses neutral multiplier', () => {
  assert.equal(defaultTpsMultiplier(undefined), 1);
});
test('disabled scaling uses neutral multiplier', () => {
  assert.equal(defaultTpsMultiplier(20, false), 1);
});
test('negative base fails', () => {
  assert.throws(() => effectiveMaxActivations(-1, 1, 1), RangeError);
});
