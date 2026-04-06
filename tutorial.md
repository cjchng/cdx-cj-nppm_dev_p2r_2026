# Tutorial: Understanding This Project

This tutorial is a guided walkthrough of the codebase. The goal is not just to tell you what files exist, but to help you build a mental model of how the project works from input to math to rendering.

By the end, you should understand:

- What the demo is trying to visualize
- Which files hold the core logic
- How latitude, longitude, and roll become a local 3D frame
- How dragging a handle changes a component length
- Where to add features or tests

## 1. Start With the Big Picture

This project is a browser-based Three.js demo that shows a point on a sphere and a local coordinate frame attached to that point.

The local frame has:

- A local `x` axis
- A local `y` axis
- A local `z` axis

The local `z` axis points outward from the sphere surface.

The local `x` and `y` axes lie in the tangent plane at that surface point.

You can move that frame around the sphere by changing:

- `latitude`
- `longitude`
- `roll`

You can also choose one of six signed components:

- `positive_x`
- `negtive_x`
- `positive_y`
- `negtive_y`
- `positive_z`
- `negtive_z`

Each component is drawn as a line or handle that can be adjusted.

## 2. Read the Project in This Order

If you are new to the repo, this reading order works well:

1. [README.md](/Users/cj/testing-nodeJS/isometric/README.md)
2. [threejs_isometric_mouse_angles.html](/Users/cj/testing-nodeJS/isometric/threejs_isometric_mouse_angles.html)
3. [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js)
4. [src/core/constants.js](/Users/cj/testing-nodeJS/isometric/src/core/constants.js)
5. [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js)
6. [tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js)

Why this order helps:

- The HTML file shows the app entry point
- `main.js` shows the runtime wiring
- `constants.js` shows the fixed project vocabulary
- `frame.js` shows the pure math
- The tests confirm the intended behavior of the pure math

## 3. File-by-File Tour

### Entry Page

[threejs_isometric_mouse_angles.html](/Users/cj/testing-nodeJS/isometric/threejs_isometric_mouse_angles.html)

This file is intentionally thin. It does three jobs:

- Defines the import map for Three.js
- Defines the two UI containers: `#info` and `#contextMenu`
- Loads [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js)

That means almost all interesting logic now lives in JavaScript modules rather than being mixed into one HTML file.

### Constants

[src/core/constants.js](/Users/cj/testing-nodeJS/isometric/src/core/constants.js)

This file defines the shared fixed values used across the app:

- `COMPONENT_KEYS`
- `DEFAULT_COMPONENTS`
- `AXIS_COLORS`
- `DEFAULT_STATE`
- `COMPONENT_LENGTH_LIMITS`

This is the first place to look if you want to know:

- What component names exist
- What the initial values are
- Which values are considered part of state
- What lengths are allowed during drag

### Pure Geometry Logic

[src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js)

This is the most important file for understanding the math.

It contains pure functions that do not depend on the browser, DOM, or Three.js classes. That is why it is easy to test.

Main exported functions:

- `latLonToVector(...)`
- `getLocalFrame(...)`
- `componentMeta(...)`
- `componentDirection(...)`
- `projectDeltaOntoDirection(...)`
- `clampLength(...)`

### Runtime and Rendering

[src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js)

This file is the app controller. It:

- Creates the scene, camera, renderer, and controls
- Builds the visible sphere, lines, handles, and helpers
- Stores mutable runtime state
- Handles keyboard, pointer, resize, and context menu events
- Calls the pure geometry functions from `frame.js`
- Updates the scene each animation frame

### Tests

[tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js)

This file tests the pure logic without needing a browser.

That is one of the biggest benefits of the refactor: the math can now be checked separately from rendering.

## 4. The Core Math Concept

The whole demo is built around one question:

How do we define a local coordinate frame at a point on a sphere?

The project answers it in three steps.

### Step 1: Convert Latitude and Longitude to a 3D Point

In [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js), `latLonToVector(latitudeDeg, longitudeDeg, radius)` converts spherical coordinates into Cartesian coordinates.

At a high level:

- Latitude controls north/south movement
- Longitude controls rotation around the sphere
- Radius scales the distance from the origin

Examples:

- `(0, 0, 2)` becomes approximately `(2, 0, 0)`
- `(90, 0, 2)` becomes approximately `(0, 0, 2)`

That surface point becomes the origin of the local frame.

### Step 2: Build the Local Axes

`getLocalFrame(latitudeDeg, longitudeDeg, rollDeg)` computes three unit vectors:

- `zAxis`: the outward normal from the sphere center to the surface point
- `xAxis`: the tangent direction chosen from east/north plus roll
- `yAxis`: the cross product of `zAxis` and `xAxis`

The code builds these directions like this:

- `zAxis` comes from the normalized surface point
- `east` is a horizontal tangent direction around the sphere
- `north` is the tangent direction toward the north pole
- `xAxis` is a rolled combination of `east` and `north`
- `yAxis` is computed from a cross product to keep the frame orthogonal

This is the geometric heart of the demo.

### Step 3: Pick a Signed Component

Once the frame exists, `componentMeta(key)` and `componentDirection(frame, key)` map names like `positive_x` or `negtive_z` to an actual direction vector.

For example:

- `positive_x` means `+frame.xAxis`
- `negtive_x` means `-frame.xAxis`
- `positive_z` means `+frame.zAxis`

This mapping drives both rendering and dragging.

## 5. How Rendering Works

The visual scene is built in [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js).

Important objects:

- `scene`
- `camera`
- `renderer`
- `controls`
- `sphere`
- `rearWireframe`
- `cursor`
- `xLine`, `yLine`, `zLine`
- `componentLines`
- `handles`

### Sphere Rendering

The project draws the sphere as wireframe only.

There are actually two wireframe meshes:

- `sphere`: the front hemisphere
- `rearWireframe`: the back hemisphere

Both use clipping planes. The clipping plane is updated based on camera direction in `updateHemispherePlanes()`.

That is how the demo keeps the front hemisphere clearly visible while allowing the rear hemisphere to be optionally shown with weaker styling.

### Local Frame Rendering

The `cursor` marks the current surface point.

The short local axes are drawn with:

- `xLine`
- `yLine`
- `zLine`

The signed component lines are stored in `componentLines`.

The currently active component is emphasized by `activeLine`.

Each frame, `updateScene()` recomputes the origin and frame, then redraws all these line segments.

## 6. How Interaction Works

The interaction code is also in [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js).

There are three main interaction paths.

### Keyboard Interaction

`bindKeyboardEvents()` handles:

- component selection with `x/X`, `y/Y`, `z/Z`
- latitude changes with `w/s`
- longitude changes with `a/d`
- roll changes with `q/e`

These updates are very direct. They mutate the `state` object, and then the next animation frame redraws the scene.

### Pointer Selection and Dragging

The project uses invisible pick spheres attached to each handle. These are stored in `pickables`.

When you press the pointer:

1. `updatePointerFromEvent()` converts screen coordinates into normalized device coordinates
2. `raycaster.intersectObjects(pickables, false)` checks which handle was hit
3. If a handle is hit, that component becomes active
4. `startLengthDrag(...)` prepares drag state

### Dragging Math

Dragging is the most subtle part of the project.

The app does not drag freely in 3D space. Instead, it builds a drag plane and projects pointer movement onto the selected component direction.

The flow is:

1. `startLengthDrag(...)` computes the selected component direction
2. It builds a plane that is stable relative to the camera and the component direction
3. On pointer move, `updateLengthDrag()` raycasts into that plane
4. The hit point delta is projected onto the component direction with `projectDeltaOntoDirection(...)`
5. The new component length is clamped with `clampLength(...)`

This is a nice example of separating a messy UI problem into:

- browser input
- 3D ray intersection
- pure projection math

## 7. How State Flows Through the App

There are two main mutable objects in [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js):

- `state`
- `components`

`state` holds UI and orientation state:

- current latitude
- current longitude
- current roll
- active component
- visibility flags
- drag mode

`components` holds the adjustable lengths for the six signed directions.

The render loop does not store derived geometry permanently. Instead, each frame it recomputes what the scene should look like from the current state.

That makes the code easier to trace:

1. Input changes state
2. `updateScene()` derives geometry from state
3. Three.js renders the result

## 8. Why the Refactor Matters

Before the refactor, all logic lived in one HTML file. That made it harder to answer simple questions like:

- Which code is pure math?
- Which code is browser-specific?
- What behavior is already tested?

Now the split is much clearer:

- `frame.js` is domain logic
- `main.js` is app wiring
- `tests/frame.test.js` is behavior verification

That is what makes the project more traceable and testable.

## 9. How to Use the Tests as a Learning Tool

Open [tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js) while reading [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js).

This pairing is especially useful because each test expresses an intended behavior in plain terms:

- equator and pole conversion
- expected local basis at `(0, 0)`
- what roll does
- how signed axes map
- how drag projection works
- how bounds are enforced

If you are trying to understand a function, the matching test is often the fastest explanation.

## 10. Suggested Exercises

If you want to learn the code actively, these are good small exercises.

### Exercise 1: Trace One Frame Update

Start in [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js) and follow:

1. `animate()`
2. `updateScene()`
3. `getOriginAndFrame()`
4. `latLonToVector(...)`
5. `getLocalFrame(...)`
6. `componentDirection(...)`

That path explains most of the runtime.

### Exercise 2: Change Default State

Edit [src/core/constants.js](/Users/cj/testing-nodeJS/isometric/src/core/constants.js) and change:

- `latitude`
- `longitude`
- `roll`
- default component lengths

Then reload the page and observe how the scene changes.

### Exercise 3: Add a New Test

In [tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js), add a test for another latitude/longitude pair or roll angle.

Then run:

```bash
npm test
```

### Exercise 4: Implement `fixGlobalCenter`

The context menu exposes `fixGlobalCenter`, but it does not currently affect behavior.

That makes it a good beginner feature:

- decide what the toggle should do
- implement it in `main.js`
- add tests for any new pure logic you extract
- update the README and this tutorial

## 11. Known Quirks

There is one naming quirk carried over from the original demo:

- `negtive_x`
- `negtive_y`
- `negtive_z`

These are misspelled versions of `negative_*`.

They are kept as-is for compatibility with the current code. If you rename them later, update:

- [src/core/constants.js](/Users/cj/testing-nodeJS/isometric/src/core/constants.js)
- [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js)
- [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js)
- [tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js)
- [README.md](/Users/cj/testing-nodeJS/isometric/README.md)

## 12. Quick Summary

If you want the shortest possible mental model, it is this:

- `constants.js` defines the vocabulary
- `frame.js` defines the math
- `main.js` turns that math into a scene and hooks up user input
- `tests/frame.test.js` proves the math behaves as expected

When you are unsure where something belongs:

- if it is math or geometry, it probably belongs in `frame.js`
- if it touches the DOM, Three.js objects, or events, it probably belongs in `main.js`

That separation is the main design idea behind the current project structure.
