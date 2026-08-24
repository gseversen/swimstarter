import type { FrameResult, Landmark, Pt } from './types.js';
import { hipAngle, midpoint } from './metrics/hipAngle.js';

const VISIBILITY_THRESHOLD = 0.5;

// E4: binary search + monotonic cursor + interpolation
export class FrameCache {
  private frames: FrameResult[] = [];
  private cursor = 0;

  load(frames: FrameResult[]) {
    this.frames = frames;
    this.cursor = 0;
  }

  get length() { return this.frames.length; }
  get all() { return this.frames; }

  lookup(t: number): FrameResult | null {
    const f = this.frames;
    if (f.length === 0) return null;
    if (t <= f[0].t) return f[0];
    if (t >= f[f.length - 1].t) return f[f.length - 1];

    // fast path: check cursor and cursor+1 (monotonic playback)
    if (this.cursor < f.length - 1 &&
        f[this.cursor].t <= t && t <= f[this.cursor + 1].t) {
      return this.interpolate(f[this.cursor], f[this.cursor + 1], t);
    }

    // binary search for bracketing pair
    let lo = 0, hi = f.length - 1;
    while (lo < hi - 1) {
      const mid = (lo + hi) >> 1;
      if (f[mid].t <= t) lo = mid;
      else hi = mid;
    }
    this.cursor = lo;

    return this.interpolate(f[lo], f[hi], t);
  }

  private interpolate(a: FrameResult, b: FrameResult, t: number): FrameResult {
    // only interpolate when both frames clear the visibility threshold
    if (a.confidence < VISIBILITY_THRESHOLD || b.confidence < VISIBILITY_THRESHOLD) {
      return Math.abs(t - a.t) <= Math.abs(t - b.t) ? a : b;
    }

    const range = b.t - a.t;
    if (range === 0) return a;
    const frac = (t - a.t) / range;

    const landmarks: Record<number, Landmark> = {};
    for (const key of Object.keys(a.landmarks)) {
      const k = Number(key);
      const la = a.landmarks[k];
      const lb = b.landmarks[k];
      if (la && lb) {
        landmarks[k] = {
          x: la.x + (lb.x - la.x) * frac,
          y: la.y + (lb.y - la.y) * frac,
          visibility: Math.min(la.visibility, lb.visibility),
        };
      } else {
        landmarks[k] = la ?? lb;
      }
    }

    // E4: interpolate hip angle from interpolated midpoints, not by lerping angles
    const joints = {} as Record<string, Landmark>;
    for (const [name, la] of Object.entries(a.joints)) {
      const lb = (b.joints as any)[name];
      if (la && lb) {
        joints[name] = {
          x: la.x + (lb.x - la.x) * frac,
          y: la.y + (lb.y - la.y) * frac,
          visibility: Math.min(la.visibility, lb.visibility),
        };
      } else {
        joints[name] = la ?? lb;
      }
    }

    const shoulderMid = midpoint(
      joints['left_shoulder'], joints['right_shoulder']
    );
    const hipMid = midpoint(joints['left_hip'], joints['right_hip']);
    const kneeMid = midpoint(joints['left_knee'], joints['right_knee']);
    const angle = Number(hipAngle(shoulderMid, hipMid, kneeMid).toFixed(1));

    return {
      t,
      landmarks,
      joints: joints as FrameResult['joints'],
      metrics: { hipAngleDeg: angle, shoulderMid, hipMid, kneeMid },
      confidence: Math.min(a.confidence, b.confidence),
    };
  }
}
