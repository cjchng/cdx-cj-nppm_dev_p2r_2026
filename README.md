# Isometric Sphere Frame Demo

This project is a small, testable Three.js demo for exploring a local coordinate frame on the surface of a sphere with an orthographic camera.

It renders:

- A clipped front hemisphere wireframe
- An optional rear hemisphere wireframe
- A local `x / y / z` frame anchored to a point on the sphere
- Selectable component handles for positive and negative axis directions
- A right-click context menu for helper visibility toggles

## Project Structure

- [threejs_isometric_mouse_angles.html](/Users/cj/testing-nodeJS/isometric/threejs_isometric_mouse_angles.html): thin browser entry page
- [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js): Three.js scene setup, rendering, and UI/event wiring
- [src/styles.css](/Users/cj/testing-nodeJS/isometric/src/styles.css): page styling
- [src/core/constants.js](/Users/cj/testing-nodeJS/isometric/src/core/constants.js): default state and shared constants
- [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js): pure geometry and component logic
- [tests/frame.test.js](/Users/cj/testing-nodeJS/isometric/tests/frame.test.js): Node-based tests for the pure logic

## What It Does

The demo computes a surface point from latitude and longitude, derives a local tangent frame, and lets you:

- Move the anchor point across the sphere
- Roll the local frame around its local `z` axis
- Select one of six signed axis components
- Drag visible handles to change component length
- Toggle helper visuals from the context menu

## Run It

Serve the repository as a static site:

```bash
npm run serve
```

Then open:

```text
http://localhost:8000/threejs_isometric_mouse_angles.html
```

This uses Python's built-in static server behind the `serve` script, so there is no dependency install step.

## Test It

Run the extracted unit tests with:

```bash
npm test
```

The current automated tests cover the pure, traceable logic in [src/core/frame.js](/Users/cj/testing-nodeJS/isometric/src/core/frame.js), including:

- Latitude/longitude to 3D vector conversion
- Local frame generation
- Roll behavior
- Signed component direction mapping
- Drag projection math
- Length clamping

The browser app also keeps a few lightweight `console.assert(...)` runtime checks in [src/main.js](/Users/cj/testing-nodeJS/isometric/src/main.js).

## Controls

Mouse:

- Left click a handle to select a component
- Drag a visible handle to adjust that component's length
- Right click to open the context menu
- Orbit and zoom with standard `OrbitControls` mouse gestures

Keyboard:

- `x` / `X`: select `positive_x` / `negtive_x`
- `y` / `Y`: select `positive_y` / `negtive_y`
- `z` / `Z`: select `positive_z` / `negtive_z`
- `w` / `s`: increase / decrease latitude
- `a` / `d`: decrease / increase longitude
- `q` / `e`: decrease / increase roll
- `Esc`: close the context menu

## Context Menu

The right-click menu exposes three toggles:

- Rear hemisphere wireframe
- Local coordinate frame
- Global center (fix/move)

The first two toggles visibly affect the scene. The `Global center` toggle is still UI state only and does not yet change scene behavior.

## Notes

- Three.js is loaded from `unpkg` via an import map
- The project now has a clearer separation between pure domain logic and browser rendering code
- Several identifiers still use the original `negtive_*` spelling so the refactor stays behavior-compatible with the existing demo
