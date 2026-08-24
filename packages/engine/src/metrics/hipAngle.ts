import type { Pt } from '../types.js';

export function hipAngle(a: Pt, vertex: Pt, b: Pt): number {
  const a1 = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const a2 = Math.atan2(b.y - vertex.y, b.x - vertex.x);
  let diff = Math.abs(a1 - a2) * (180 / Math.PI);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function midpoint(a: Pt, b: Pt): Pt {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
