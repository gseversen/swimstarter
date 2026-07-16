// Run: node src/utils/mathHelpers.test.mjs
import assert from "node:assert/strict";
import { angleFromHorizontal, midpoint, torsoAngle } from "./mathHelpers.js";

// Horizontal line -> 0 degrees.
assert.equal(angleFromHorizontal({ x: 0, y: 0.5 }, { x: 1, y: 0.5 }), 0);

// Straight up (screen y decreases) -> +90 degrees.
assert.equal(angleFromHorizontal({ x: 0.5, y: 1 }, { x: 0.5, y: 0 }), 90);

assert.deepEqual(midpoint({ x: 0, y: 0 }, { x: 1, y: 1 }), { x: 0.5, y: 0.5 });

// Shoulders above hips -> positive torso angle.
assert.ok(torsoAngle({ x: 0.5, y: 0.3 }, { x: 0.5, y: 0.6 }) > 0);

console.log("mathHelpers self-check passed");
