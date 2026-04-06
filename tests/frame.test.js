import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampLength,
  componentDirection,
  componentMeta,
  getLocalFrame,
  latLonToVector,
  projectDeltaOntoDirection,
  vectorMath
} from '../src/core/frame.js';

function approx(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `expected ${actual} to be within ${tolerance} of ${expected}`);
}

function approxVector(actual, expected, tolerance = 1e-6) {
  approx(actual.x, expected.x, tolerance);
  approx(actual.y, expected.y, tolerance);
  approx(actual.z, expected.z, tolerance);
}

test('latLonToVector maps equator and pole correctly', () => {
  approxVector(latLonToVector(0, 0, 2), { x: 2, y: 0, z: 0 });
  approxVector(latLonToVector(90, 0, 2), { x: 0, y: 0, z: 2 });
});

test('getLocalFrame returns expected basis at equator prime meridian', () => {
  const frame = getLocalFrame(0, 0, 0);

  approxVector(frame.xAxis, { x: 0, y: 1, z: 0 });
  approxVector(frame.yAxis, { x: 0, y: 0, z: 1 });
  approxVector(frame.zAxis, { x: 1, y: 0, z: 0 });
});

test('getLocalFrame applies roll around the local z axis', () => {
  const frame = getLocalFrame(0, 0, 90);

  approxVector(frame.xAxis, { x: 0, y: 0, z: 1 });
  approxVector(frame.yAxis, { x: 0, y: -1, z: 0 });
  approxVector(frame.zAxis, { x: 1, y: 0, z: 0 });
});

test('componentMeta and componentDirection preserve sign and axis mapping', () => {
  const frame = getLocalFrame(0, 0, 0);

  assert.deepEqual(componentMeta('positive_y'), { axis: 'y', sign: 1 });
  assert.deepEqual(componentMeta('negtive_z'), { axis: 'z', sign: -1 });
  approxVector(componentDirection(frame, 'positive_x'), { x: 0, y: 1, z: 0 });
  approxVector(componentDirection(frame, 'negtive_x'), { x: 0, y: -1, z: 0 });
});

test('drag projection returns signed movement along a direction', () => {
  const delta = projectDeltaOntoDirection(
    { x: 0, y: 0, z: 0 },
    { x: 0.25, y: 0.1, z: 0 },
    vectorMath.normalizeVector({ x: 1, y: 0, z: 0 })
  );

  approx(delta, 0.25);
});

test('clampLength enforces component bounds', () => {
  assert.equal(clampLength(-1, 0.08, 1.5), 0.08);
  assert.equal(clampLength(0.5, 0.08, 1.5), 0.5);
  assert.equal(clampLength(3, 0.08, 1.5), 1.5);
});
