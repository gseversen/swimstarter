import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FrameCache } from '../src/cache.js';
import type { FrameResult } from '../src/types.js';

function makeFrame(t: number, angle: number = 120, conf: number = 0.9): FrameResult {
  const lm = { x: 0.5, y: 0.5, visibility: conf };
  return {
    t,
    landmarks: { 11: lm, 12: lm, 23: lm, 24: lm, 25: lm, 26: lm },
    joints: {
      nose: lm, mouth_left: lm, mouth_right: lm,
      left_shoulder: lm, right_shoulder: lm,
      left_wrist: lm, right_wrist: lm,
      left_pinky: lm, right_pinky: lm,
      left_hip: lm, right_hip: lm,
      left_knee: lm, right_knee: lm,
      left_ankle: lm, right_ankle: lm,
      left_foot_index: lm, right_foot_index: lm,
    },
    metrics: {
      hipAngleDeg: angle,
      shoulderMid: { x: 0.5, y: 0.3 },
      hipMid: { x: 0.5, y: 0.5 },
      kneeMid: { x: 0.5, y: 0.7 },
    },
    confidence: conf,
  };
}

describe('FrameCache', () => {
  it('returns null for empty cache', () => {
    const c = new FrameCache();
    assert.equal(c.lookup(1), null);
  });

  it('clamps to first/last frame', () => {
    const c = new FrameCache();
    c.load([makeFrame(1), makeFrame(2), makeFrame(3)]);
    assert.equal(c.lookup(0)!.t, 1);
    assert.equal(c.lookup(99)!.t, 3);
  });

  it('finds exact match', () => {
    const c = new FrameCache();
    c.load([makeFrame(1), makeFrame(2), makeFrame(3)]);
    const r = c.lookup(2);
    assert.equal(r!.t, 2);
  });

  it('interpolates between frames', () => {
    const c = new FrameCache();
    c.load([makeFrame(0), makeFrame(1)]);
    const r = c.lookup(0.5);
    assert.ok(r);
    assert.ok(Math.abs(r.t - 0.5) < 0.001);
  });

  it('does not interpolate across low-confidence frames', () => {
    const c = new FrameCache();
    c.load([makeFrame(0, 120, 0.9), makeFrame(1, 120, 0.3)]);
    const r = c.lookup(0.5);
    assert.ok(r);
    assert.equal(r.t, 0); // returns nearest valid, not interpolated
  });

  it('handles monotonic cursor fast path', () => {
    const c = new FrameCache();
    const frames = Array.from({ length: 100 }, (_, i) => makeFrame(i * 0.033));
    c.load(frames);
    for (let i = 0; i < 99; i++) {
      const r = c.lookup(i * 0.033 + 0.01);
      assert.ok(r);
    }
  });
});
