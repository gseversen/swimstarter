import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serialize, deserialize, isStale } from '../src/serialize.js';
import type { AnalysisResult } from '../src/types.js';

function makeResult(): AnalysisResult {
  const lm = { x: 0.41234567, y: 0.33812345, visibility: 0.92345 };
  return {
    version: 1,
    modelId: 'pose_landmarker_full@0.10.35',
    sampleRateHz: 30,
    duration: 8.4,
    frames: [{
      t: 2.63,
      landmarks: {
        0: lm, 9: lm, 10: lm,
        11: lm, 12: lm, 15: lm, 16: lm, 17: lm, 18: lm,
        23: lm, 24: lm, 25: lm, 26: lm, 27: lm, 28: lm,
        31: lm, 32: lm,
      },
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
        hipAngleDeg: 146.8,
        shoulderMid: { x: 0.412, y: 0.338 },
        hipMid: { x: 0.498, y: 0.523 },
        kneeMid: { x: 0.585, y: 0.702 },
      },
      confidence: 0.82,
    }],
  };
}

describe('serialize / deserialize', () => {
  it('round-trips without data loss', () => {
    const original = makeResult();
    const json = serialize(original);
    const restored = deserialize(json);
    assert.equal(restored.version, 1);
    assert.equal(restored.modelId, original.modelId);
    assert.equal(restored.frames.length, 1);
    assert.equal(restored.frames[0].t, 2.63);
    assert.ok(Object.keys(restored.frames[0].joints).length === 17);
  });

  it('rounds coordinates to 4 decimal places', () => {
    const json = serialize(makeResult());
    const parsed = JSON.parse(json);
    const [x] = parsed.frames[0].lm['0'];
    const decimals = x.toString().split('.')[1]?.length ?? 0;
    assert.ok(decimals <= 4);
  });

  it('joints are not persisted, only landmarks', () => {
    const json = serialize(makeResult());
    const parsed = JSON.parse(json);
    assert.equal(parsed.frames[0].joints, undefined);
  });
});

describe('isStale', () => {
  it('returns false for matching modelId', () => {
    assert.equal(isStale(makeResult(), 'pose_landmarker_full@0.10.35'), false);
  });

  it('returns true for mismatched modelId', () => {
    assert.equal(isStale(makeResult(), 'pose_landmarker_full@0.11.0'), true);
  });
});
