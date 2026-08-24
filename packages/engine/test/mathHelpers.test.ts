import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hipAngle, midpoint } from '../src/metrics/hipAngle.js';

describe('midpoint', () => {
  it('averages two points', () => {
    const m = midpoint({ x: 0, y: 0 }, { x: 1, y: 1 });
    assert.deepStrictEqual(m, { x: 0.5, y: 0.5 });
  });
});

describe('hipAngle', () => {
  it('returns 180 for a straight line', () => {
    assert.equal(
      hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1 }),
      180,
    );
  });

  it('returns 90 for a right angle', () => {
    assert.equal(
      hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 }),
      90,
    );
  });

  it('returns < 90 for an acute pike', () => {
    const a = hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.8, y: 0.2 });
    assert.ok(a < 90, `expected < 90 but got ${a}`);
  });

  it('is symmetric', () => {
    const a = hipAngle({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 0 });
    const b = hipAngle({ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 0 });
    assert.equal(a, b);
  });
});
