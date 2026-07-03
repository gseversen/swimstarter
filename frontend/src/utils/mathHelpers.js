/**
 * Angle (in degrees) of the line from point `a` to point `b`, measured from
 * the horizontal. Points use normalized coordinates (0-1). Screen Y grows
 * downward, so we negate dy to report a conventional upward-positive angle.
 *
 * @param {{x: number, y: number}} a
 * @param {{x: number, y: number}} b
 * @returns {number} angle in degrees, range (-180, 180]
 */
export function angleFromHorizontal(a, b) {
  // `+ 0` normalizes -0 (from a perfectly horizontal line) to 0.
  return (Math.atan2(-(b.y - a.y), b.x - a.x) * 180) / Math.PI + 0;
}

/**
 * Torso angle relative to the water line. The water line is horizontal, so the
 * torso angle vs. horizontal is the angle vs. the water line.
 *
 * ponytail: expand with real hip/shoulder midpoints once MediaPipe lands.
 *
 * @param {{x: number, y: number}} shoulderMid
 * @param {{x: number, y: number}} hipMid
 * @returns {number} degrees
 */
export function torsoAngleVsWaterline(shoulderMid, hipMid) {
  return angleFromHorizontal(hipMid, shoulderMid);
}

/** Midpoint of two normalized points. */
export function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
