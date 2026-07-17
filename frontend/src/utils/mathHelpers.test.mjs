// Run: node src/utils/mathHelpers.test.mjs
import assert from "node:assert/strict";
import { hipAngle, midpoint } from "./mathHelpers.js";

// midpoint
assert.deepEqual(midpoint({ x: 0, y: 0 }, { x: 1, y: 1 }), { x: 0.5, y: 0.5 });

// hipAngle: straight line (shoulder directly above hip, knee directly below) -> 180
const straight = hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.5, y: 1 });
assert.equal(straight, 180);

// hipAngle: right angle -> 90
const right = hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 1, y: 0.5 });
assert.equal(right, 90);

// hipAngle: acute pike (< 90)
const pike = hipAngle({ x: 0.5, y: 0 }, { x: 0.5, y: 0.5 }, { x: 0.8, y: 0.2 });
assert.ok(pike < 90, `expected pike < 90, got ${pike}`);

console.log("mathHelpers self-check passed");
