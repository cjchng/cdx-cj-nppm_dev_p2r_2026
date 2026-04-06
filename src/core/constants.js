export const COMPONENT_KEYS = [
  'positive_x',
  'negtive_x',
  'positive_y',
  'negtive_y',
  'positive_z',
  'negtive_z'
];

export const DEFAULT_COMPONENTS = {
  positive_x: 0.5,
  negtive_x: 0.3,
  positive_y: 0.5,
  negtive_y: 0.3,
  positive_z: 0.5,
  negtive_z: 0.3
};

export const AXIS_COLORS = {
  x: 0xff5555,
  y: 0x55ff55,
  z: 0x5599ff
};

export const DEFAULT_STATE = {
  latitude: 20,
  longitude: 35,
  roll: 0,
  active: 'positive_x',
  dragMode: null,
  showRearWireframe: true,
  showLocalFrame: true,
  fixGlobalCenter: true
};

export const COMPONENT_LENGTH_LIMITS = {
  min: 0.08,
  max: 1.5
};
