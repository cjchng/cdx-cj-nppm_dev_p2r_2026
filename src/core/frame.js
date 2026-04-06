function degToRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function vector(x, y, z) {
  return { x, y, z };
}

function addVectors(a, b) {
  return vector(a.x + b.x, a.y + b.y, a.z + b.z);
}

function subtractVectors(a, b) {
  return vector(a.x - b.x, a.y - b.y, a.z - b.z);
}

function scaleVector(v, scalar) {
  return vector(v.x * scalar, v.y * scalar, v.z * scalar);
}

function dotVectors(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossVectors(a, b) {
  return vector(
    a.y * b.z - a.z * b.y,
    a.z * b.x - a.x * b.z,
    a.x * b.y - a.y * b.x
  );
}

function lengthOf(v) {
  return Math.sqrt(dotVectors(v, v));
}

function normalizeVector(v) {
  const length = lengthOf(v);
  if (length === 0) {
    return vector(0, 0, 0);
  }

  return scaleVector(v, 1 / length);
}

function rotateBasis(east, north, rollDeg) {
  const roll = degToRad(rollDeg);
  const cosRoll = Math.cos(roll);
  const sinRoll = Math.sin(roll);

  return normalizeVector(
    addVectors(scaleVector(east, cosRoll), scaleVector(north, sinRoll))
  );
}

export function latLonToVector(latitudeDeg, longitudeDeg, radius) {
  const latitude = degToRad(latitudeDeg);
  const longitude = degToRad(longitudeDeg);
  const cosLatitude = Math.cos(latitude);

  return vector(
    radius * cosLatitude * Math.cos(longitude),
    radius * cosLatitude * Math.sin(longitude),
    radius * Math.sin(latitude)
  );
}

export function getLocalFrame(latitudeDeg, longitudeDeg, rollDeg = 0) {
  const latitude = degToRad(latitudeDeg);
  const longitude = degToRad(longitudeDeg);
  const zAxis = normalizeVector(latLonToVector(latitudeDeg, longitudeDeg, 1));
  const east = normalizeVector(vector(-Math.sin(longitude), Math.cos(longitude), 0));
  const north = normalizeVector(
    vector(
      -Math.sin(latitude) * Math.cos(longitude),
      -Math.sin(latitude) * Math.sin(longitude),
      Math.cos(latitude)
    )
  );
  const xAxis = rotateBasis(east, north, rollDeg);
  const yAxis = normalizeVector(crossVectors(zAxis, xAxis));

  return { xAxis, yAxis, zAxis };
}

export function componentMeta(key) {
  switch (key) {
    case 'positive_x':
      return { axis: 'x', sign: 1 };
    case 'negtive_x':
      return { axis: 'x', sign: -1 };
    case 'positive_y':
      return { axis: 'y', sign: 1 };
    case 'negtive_y':
      return { axis: 'y', sign: -1 };
    case 'positive_z':
      return { axis: 'z', sign: 1 };
    case 'negtive_z':
      return { axis: 'z', sign: -1 };
    default:
      return { axis: 'x', sign: 1 };
  }
}

export function componentDirection(frame, key) {
  const meta = componentMeta(key);
  const base =
    meta.axis === 'x' ? frame.xAxis :
    meta.axis === 'y' ? frame.yAxis :
    frame.zAxis;

  return scaleVector(base, meta.sign);
}

export function projectDeltaOntoDirection(startPoint, currentPoint, direction) {
  return dotVectors(subtractVectors(currentPoint, startPoint), direction);
}

export function clampLength(value, min, max) {
  return clamp(value, min, max);
}

export const vectorMath = {
  addVectors,
  crossVectors,
  dotVectors,
  lengthOf,
  normalizeVector,
  projectDeltaOntoDirection,
  scaleVector,
  subtractVectors,
  vector
};
