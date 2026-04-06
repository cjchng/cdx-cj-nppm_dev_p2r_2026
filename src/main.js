import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  AXIS_COLORS,
  COMPONENT_KEYS,
  COMPONENT_LENGTH_LIMITS,
  DEFAULT_COMPONENTS,
  DEFAULT_STATE
} from './core/constants.js';
import {
  clampLength,
  componentDirection,
  componentMeta,
  getLocalFrame,
  latLonToVector,
  vectorMath
} from './core/frame.js';

const info = document.getElementById('info');
const contextMenu = document.getElementById('contextMenu');

const sphereRadius = 2;
const frustumSize = 6;
const components = { ...DEFAULT_COMPONENTS };
const state = { ...DEFAULT_STATE };

const scene = new THREE.Scene();
const camera = createCamera();
const renderer = createRenderer();
const controls = createControls(camera, renderer);

const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 48, 32);
const hemispherePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
const inverseHemispherePlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);

const sphere = new THREE.Mesh(
  sphereGeometry,
  new THREE.MeshBasicMaterial({
    wireframe: true,
    opacity: 0.3,
    transparent: true,
    color: 0xe5e7eb,
    clippingPlanes: [hemispherePlane]
  })
);

const rearWireframe = new THREE.Mesh(
  sphereGeometry,
  new THREE.MeshBasicMaterial({
    wireframe: true,
    opacity: 0.16,
    transparent: true,
    color: 0x64748b,
    clippingPlanes: [inverseHemispherePlane]
  })
);

rearWireframe.visible = true;
scene.add(sphere, rearWireframe, new THREE.AxesHelper(3));

const cursor = new THREE.Mesh(
  new THREE.SphereGeometry(0.025, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0xffffff })
);

const xLine = makeLine(AXIS_COLORS.x);
const yLine = makeLine(AXIS_COLORS.y);
const zLine = makeLine(AXIS_COLORS.z);
const activeLine = makeLine(0xffcc33);

const componentLines = Object.fromEntries(
  COMPONENT_KEYS.map((key) => {
    const meta = componentMeta(key);
    return [key, makeLine(AXIS_COLORS[meta.axis])];
  })
);

scene.add(cursor, xLine, yLine, zLine, activeLine, ...Object.values(componentLines));

const localFrameObjects = [cursor, xLine, yLine, zLine, activeLine, ...Object.values(componentLines)];
const handles = {};
const pickables = [];

for (const key of COMPONENT_KEYS) {
  const meta = componentMeta(key);
  const color = AXIS_COLORS[meta.axis];
  const group = new THREE.Group();
  let tip;

  if (key === 'negtive_z') {
    tip = new THREE.Object3D();
  } else if (meta.axis === 'z' && meta.sign > 0) {
    tip = new THREE.Mesh(
      new THREE.ConeGeometry(0.03, 0.07, 16),
      new THREE.MeshBasicMaterial({ color })
    );
  } else {
    tip = new THREE.Mesh(
      new THREE.CircleGeometry(0.032, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })
    );
  }

  const pick = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 12, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0 })
  );

  pick.userData.componentKey = key;
  group.add(tip);
  group.add(pick);
  scene.add(group);

  handles[key] = { group, tip, pick };
  pickables.push(pick);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const dragPlane = new THREE.Plane();
const dragHit = new THREE.Vector3();
const dragState = {
  active: false,
  componentKey: null,
  startLength: 0,
  startPoint: new THREE.Vector3(),
  origin: new THREE.Vector3(),
  dir: new THREE.Vector3(),
  pointerId: null
};

scene.add(new THREE.AmbientLight(0xffffff, 0.9));
const light = new THREE.DirectionalLight(0xffffff, 0.8);
light.position.set(4, 6, 8);
scene.add(light);

bindPointerEvents();
bindKeyboardEvents();
bindContextMenuEvents();
bindResizeEvent();

runSelfTests();
updateContextMenuLabels();
animate();

function createCamera() {
  const aspect = window.innerWidth / window.innerHeight;
  const nextCamera = new THREE.OrthographicCamera(
    (-frustumSize * aspect) / 2,
    (frustumSize * aspect) / 2,
    frustumSize / 2,
    -frustumSize / 2,
    0.1,
    100
  );

  nextCamera.position.set(4, 4, 4);
  nextCamera.lookAt(0, 0, 0);
  return nextCamera;
}

function createRenderer() {
  const nextRenderer = new THREE.WebGLRenderer({ antialias: true });
  nextRenderer.localClippingEnabled = true;
  nextRenderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(nextRenderer.domElement);
  return nextRenderer;
}

function createControls(nextCamera, nextRenderer) {
  const nextControls = new OrbitControls(nextCamera, nextRenderer.domElement);
  nextControls.enableDamping = true;
  nextControls.minZoom = 0.5;
  nextControls.maxZoom = 5;
  return nextControls;
}

function toThreeVector3(value) {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function makeLine(color) {
  return new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]),
    new THREE.LineBasicMaterial({ color })
  );
}

function updateLine(line, origin, direction, length) {
  line.geometry.setFromPoints([
    origin.clone(),
    origin.clone().add(direction.clone().multiplyScalar(length))
  ]);
}

function updateHandle(handle, origin, direction, length, active, isZ, isNegativeZ) {
  const tipPosition = isNegativeZ ? new THREE.Vector3(0, 0, 0) : origin.clone().add(direction.clone().multiplyScalar(length));
  handle.group.position.copy(tipPosition);

  if (isZ && !isNegativeZ) {
    handle.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  } else if (!isZ) {
    handle.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), direction);
  } else {
    handle.group.quaternion.identity();
  }

  if (handle.tip instanceof THREE.Mesh) {
    handle.tip.visible = !isNegativeZ;
    handle.tip.position.set(0, 0, 0);
    handle.tip.scale.setScalar(active ? 0.625 : 0.5);
  }
}

function updateHemispherePlanes() {
  const viewDirection = camera.position.clone().normalize();
  hemispherePlane.set(viewDirection, 0);
  inverseHemispherePlane.set(viewDirection.clone().negate(), 0);
}

function getOriginAndFrame() {
  const origin = latLonToVector(state.latitude, state.longitude, sphereRadius);
  const frame = getLocalFrame(state.latitude, state.longitude, state.roll);

  return {
    origin: toThreeVector3(origin),
    frame: {
      xAxis: toThreeVector3(frame.xAxis),
      yAxis: toThreeVector3(frame.yAxis),
      zAxis: toThreeVector3(frame.zAxis)
    }
  };
}

function updateScene() {
  if (!Number.isFinite(state.latitude) || !Number.isFinite(state.longitude)) {
    return;
  }

  updateHemispherePlanes();
  const { origin, frame } = getOriginAndFrame();
  cursor.position.copy(origin);

  updateLine(xLine, origin, frame.xAxis, 0.55);
  updateLine(yLine, origin, frame.yAxis, 0.55);
  updateLine(zLine, origin, frame.zAxis, 0.55);

  for (const [key, line] of Object.entries(componentLines)) {
    const direction = toThreeVector3(componentDirection(frame, key));
    const length = components[key];

    if (key === 'negtive_z') {
      line.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), origin.clone()]);
    } else {
      updateLine(line, origin, direction, length);
    }

    const meta = componentMeta(key);
    updateHandle(handles[key], origin, direction, length, state.active === key, meta.axis === 'z', key === 'negtive_z');
    handles[key].group.visible = state.showLocalFrame;
  }

  if (state.active === 'negtive_z') {
    activeLine.geometry.setFromPoints([new THREE.Vector3(0, 0, 0), origin.clone()]);
  } else {
    const activeDirection = toThreeVector3(componentDirection(frame, state.active));
    updateLine(activeLine, origin, activeDirection, components[state.active]);
  }

  rearWireframe.visible = state.showRearWireframe;
  localFrameObjects.forEach((object3d) => {
    object3d.visible = state.showLocalFrame;
  });

  info.textContent =
`step 2+: click-select + drag-tip length
active: ${state.active}
drag: ${state.dragMode ?? 'none'}
lat: ${state.latitude.toFixed(1)}
lon: ${state.longitude.toFixed(1)}
roll: ${state.roll.toFixed(1)}

positive_x: ${components.positive_x.toFixed(2)}
negtive_x: ${components.negtive_x.toFixed(2)}
positive_y: ${components.positive_y.toFixed(2)}
negtive_y: ${components.negtive_y.toFixed(2)}
positive_z: ${components.positive_z.toFixed(2)}
negtive_z: ${components.negtive_z.toFixed(2)}

click line/tip : activate component
drag tip       : adjust active length
x/X y/Y z/Z    : select +/- component
w/s            : latitude +/-
a/d            : longitude -/+
q/e            : roll -/+
right click    : context help menu
rear wireframe : toggles only the back hemisphere
note           : front hemisphere always remains visible`;
}

function updatePointerFromEvent(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function getOriginAndDirectionFor(componentKey) {
  const origin = latLonToVector(state.latitude, state.longitude, sphereRadius);
  const frame = getLocalFrame(state.latitude, state.longitude, state.roll);

  return {
    origin: toThreeVector3(origin),
    direction: toThreeVector3(componentDirection(frame, componentKey))
  };
}

function startLengthDrag(componentKey, pointerId) {
  if (componentKey === 'negtive_z') {
    return;
  }

  const { origin, direction } = getOriginAndDirectionFor(componentKey);
  dragState.active = true;
  dragState.componentKey = componentKey;
  dragState.startLength = components[componentKey];
  dragState.origin.copy(origin);
  dragState.dir.copy(direction);
  dragState.pointerId = pointerId;

  const cameraDirection = camera.position.clone().sub(origin).normalize();
  const planeNormal = new THREE.Vector3().crossVectors(direction, cameraDirection);

  if (planeNormal.lengthSq() < 1e-8) {
    planeNormal.set(0, 0, 1);
  } else {
    planeNormal.cross(direction).normalize();
  }

  const tipPosition = origin.clone().add(direction.clone().multiplyScalar(components[componentKey]));
  dragPlane.setFromNormalAndCoplanarPoint(planeNormal, tipPosition);
  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(dragPlane, dragState.startPoint);
  controls.enabled = false;
  state.dragMode = 'length';
}

function updateLengthDrag() {
  raycaster.setFromCamera(mouse, camera);
  if (!raycaster.ray.intersectPlane(dragPlane, dragHit)) {
    return;
  }

  const projected = vectorMath.projectDeltaOntoDirection(
    { x: dragState.startPoint.x, y: dragState.startPoint.y, z: dragState.startPoint.z },
    { x: dragHit.x, y: dragHit.y, z: dragHit.z },
    { x: dragState.dir.x, y: dragState.dir.y, z: dragState.dir.z }
  );

  components[dragState.componentKey] = clampLength(
    dragState.startLength + projected,
    COMPONENT_LENGTH_LIMITS.min,
    COMPONENT_LENGTH_LIMITS.max
  );
}

function bindPointerEvents() {
  renderer.domElement.addEventListener('pointerdown', (event) => {
    updatePointerFromEvent(event);
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(pickables, false);

    if (hits.length === 0) {
      return;
    }

    const componentKey = hits[0].object.userData.componentKey;
    state.active = componentKey;
    startLengthDrag(componentKey, event.pointerId);
    renderer.domElement.setPointerCapture(event.pointerId);
  });

  renderer.domElement.addEventListener('pointermove', (event) => {
    updatePointerFromEvent(event);
    if (dragState.active) {
      updateLengthDrag();
    }
  });

  renderer.domElement.addEventListener('pointerup', (event) => {
    if (!dragState.active || dragState.pointerId !== event.pointerId) {
      return;
    }

    dragState.active = false;
    dragState.componentKey = null;
    dragState.pointerId = null;
    controls.enabled = true;
    state.dragMode = null;
  });
}

function bindKeyboardEvents() {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'x') state.active = 'positive_x';
    if (event.key === 'X') state.active = 'negtive_x';
    if (event.key === 'y') state.active = 'positive_y';
    if (event.key === 'Y') state.active = 'negtive_y';
    if (event.key === 'z') state.active = 'positive_z';
    if (event.key === 'Z') state.active = 'negtive_z';

    if (event.key === 'w') state.latitude = Math.min(89, state.latitude + 2);
    if (event.key === 's') state.latitude = Math.max(-89, state.latitude - 2);
    if (event.key === 'a') state.longitude -= 2;
    if (event.key === 'd') state.longitude += 2;
    if (event.key === 'q') state.roll -= 3;
    if (event.key === 'e') state.roll += 3;
  });
}

function updateContextMenuLabels() {
  const rearLabel = contextMenu.querySelector('[data-state="toggleRearWireframe"]');
  const localLabel = contextMenu.querySelector('[data-state="toggleLocalFrame"]');
  const centerLabel = contextMenu.querySelector('[data-state="toggleGlobalCenter"]');

  rearLabel.textContent = state.showRearWireframe ? 'shown' : 'hidden';
  localLabel.textContent = state.showLocalFrame ? 'shown' : 'hidden';
  centerLabel.textContent = state.fixGlobalCenter ? 'fixed' : 'move';
}

function hideContextMenu() {
  contextMenu.style.display = 'none';
}

function showContextMenu(x, y) {
  updateContextMenuLabels();
  contextMenu.style.display = 'block';

  const width = 240;
  const height = 110;
  const clampedX = Math.min(x, window.innerWidth - width - 8);
  const clampedY = Math.min(y, window.innerHeight - height - 8);

  contextMenu.style.left = `${Math.max(8, clampedX)}px`;
  contextMenu.style.top = `${Math.max(8, clampedY)}px`;
}

function bindContextMenuEvents() {
  contextMenu.addEventListener('click', (event) => {
    const item = event.target.closest('.menu-item');
    if (!item) {
      return;
    }

    const command = item.dataset.command;

    if (command === 'toggleRearWireframe') {
      state.showRearWireframe = !state.showRearWireframe;
    } else if (command === 'toggleLocalFrame') {
      state.showLocalFrame = !state.showLocalFrame;
    } else if (command === 'toggleGlobalCenter') {
      state.fixGlobalCenter = !state.fixGlobalCenter;
    }

    updateContextMenuLabels();
    hideContextMenu();
  });

  renderer.domElement.addEventListener('contextmenu', (event) => {
    event.preventDefault();
    showContextMenu(event.clientX, event.clientY);
  });

  window.addEventListener('pointerdown', (event) => {
    if (!contextMenu.contains(event.target)) {
      hideContextMenu();
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      hideContextMenu();
    }
  });
}

function bindResizeEvent() {
  window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = (-frustumSize * aspect) / 2;
    camera.right = (frustumSize * aspect) / 2;
    camera.top = frustumSize / 2;
    camera.bottom = -frustumSize / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function runSelfTests() {
  const point = latLonToVector(0, 0, sphereRadius);
  console.assert(Math.abs(point.x - sphereRadius) < 1e-6, 'latLonToVector(0,0) should be on +X');
  console.assert(Math.abs(point.y) < 1e-6, 'latLonToVector(0,0) y should be 0');
  console.assert(Math.abs(point.z) < 1e-6, 'latLonToVector(0,0) z should be 0');

  const northPole = latLonToVector(90, 0, sphereRadius);
  console.assert(Math.abs(northPole.z - sphereRadius) < 1e-6, 'north pole should be on +Z');

  const frame = getLocalFrame(0, 0, 0);
  console.assert(Math.abs(frame.xAxis.x) < 1e-6 && Math.abs(frame.xAxis.y - 1) < 1e-6, 'xAxis at equator should align with +Y');
  console.assert(Math.abs(frame.yAxis.z - 1) < 1e-6, 'yAxis at equator should align with +Z');
  console.assert(Math.abs(frame.zAxis.x - 1) < 1e-6, 'zAxis at equator should align with +X');

  console.assert(Object.keys(componentLines).length === 6, 'there should be 6 component lines');
  console.assert(Object.keys(handles).length === 6, 'there should be 6 selectable handles');
  console.assert(handles.positive_x.tip instanceof THREE.Object3D, 'positive_x handle should exist');
  console.assert(handles.negtive_z.tip instanceof THREE.Object3D, 'negtive_z handle should exist');

  const savedLength = components.positive_x;
  components.positive_x = clampLength(
    savedLength + vectorMath.projectDeltaOntoDirection(
      { x: 0, y: 0, z: 0 },
      { x: 0.2, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 }
    ),
    COMPONENT_LENGTH_LIMITS.min,
    COMPONENT_LENGTH_LIMITS.max
  );
  console.assert(components.positive_x > savedLength, 'drag math should increase length when moving along component direction');
  components.positive_x = savedLength;
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  updateScene();
  renderer.render(scene, camera);
}
