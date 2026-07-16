/**
 * Interior angle at `vertex` formed by rays vertex→a and vertex→b.
 * Works with normalized (0-1) screen coordinates (Y-down); the relative
 * angle between two rays from the same origin is sign-agnostic so no
 * Y-flip is needed.
 *
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} vertex
 * @param {{x: number, y: number}} b
 * @returns {number} degrees in [0, 180]
 */
export function hipAngle(a, vertex, b) {
  const a1 = Math.atan2(a.y - vertex.y, a.x - vertex.x);
  const a2 = Math.atan2(b.y - vertex.y, b.x - vertex.x);
  let diff = Math.abs(a1 - a2) * (180 / Math.PI);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

/** Midpoint of two normalized points. */
export function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
