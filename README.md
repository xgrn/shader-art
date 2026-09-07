# shader-art

Build pure fragment-shader art as graphs of typed nodes.

**[Live demo →](https://xgrn.github.io/shader-art/)**

You wire nodes together in TypeScript. The library walks the graph reachable from
a `RendererNode`, compiles it to a single GLSL fragment shader, and runs it on a
full-screen quad through Three.js. Every node also has a CPU implementation, so
the exact same graph can be pull-evaluated pixel-by-pixel in a test — no WebGL,
no headless GL — and asserted against the maths it's supposed to express.

- **Typed ports.** `float` / `vec2` / `vec3` / `vec4`. Mismatches throw at wire
  time; scalar-to-vector broadcasting follows GLSL rules.
- **No shader strings in user code.** Nodes emit GLSL; the compiler hoists,
  dedupes helpers, and collects uniforms.
- **CPU/GPU parity.** `emit()` (GLSL) and `compute()` (JS) sit side by side in
  each node.

```
src/       the library — graph/ ports, nodes/ by category, render/ compile + App
examples/  one folder per example; shell.tsx + ui.scss are the shared Preact chrome
tests/     Vitest specs — engine/ and examples/, each split into e2e/ and unit/
```

## Install

```sh
npm install
```

Requires Node 20+. `preact` and `three` are runtime deps; everything else is dev.

## Run the dev server

```sh
npm run dev
```

Vite serves the example gallery at `http://localhost:5173/`. Each example is its
own entry under `examples/<name>/`.

| command              | what it does                        |
|----------------------|-------------------------------------|
| `npm run dev`        | Vite dev server + example gallery   |
| `npm test`           | run the Vitest suite once           |
| `npm run test:watch` | Vitest in watch mode                |
| `npm run typecheck`  | `tsc --noEmit`                      |
| `npm run build`      | typecheck + `vite build`            |

## A first graph

`time → (+ phase) → sin → renderer`, one phase-shifted sine per channel. Nothing
reads a per-pixel coordinate, so the whole viewport is one colour that cycles.

```ts
import { App, AddNode, Constant, RendererNode, SinNode, TimeNode } from './src';

const TAU = Math.PI * 2;

const time = new TimeNode();
const channel = (phase: number) =>
  new SinNode(new AddNode(time.out.t, new Constant(phase)));

const renderer = new RendererNode({
  r: channel(0),
  g: channel(TAU / 3),
  b: channel((2 * TAU) / 3),
});

// Run it on a canvas:
const app = new App(renderer, { mount: '#stage', width: 640, height: 480 });
app.run();

// …or evaluate it on the CPU, no WebGL:
app.sample({ time: 1.5 }); // -> [r, g, b, 1]
```

A node's constructor takes its inputs positionally; you can pass another node
(its sole `out.value`) or a specific `OutputPort` such as `time.out.t`. See
`examples/` for graphs that use `UVNode`, `PolarNode`, escape-time loops, a
software rasteriser, and audio-driven uniforms.

## App API

`new App(renderer, options?)` — compiles `renderer` immediately (`app.shader` is
ready before any canvas exists). `options`:

| option       | default                        | meaning                          |
|--------------|--------------------------------|----------------------------------|
| `mount`      | `document.body`                | element or CSS selector to host the canvas |
| `width`      | mount's width, then `innerWidth`  | canvas width in CSS px        |
| `height`     | mount's height, then `innerHeight`| canvas height in CSS px       |
| `pixelRatio` | `devicePixelRatio` (capped)    | render scale                     |

| member | description |
|--------|-------------|
| `run()` | mount the canvas and start the animation loop |
| `stop()` | halt the loop; `run()` resumes it |
| `renderOnce()` | mount if needed and draw exactly one frame |
| `destroy()` | halt, dispose GPU objects, remove the DOM. Not reusable |
| `isRunning` | whether the loop is active |
| `tick(elapsed?)` | advance one frame by hand — fires `frame`, syncs uniforms. `elapsed` defaults to wall-clock seconds. Use it to step deterministically |
| `sample({ time?, uv? })` | CPU-evaluate the final colour, returns `[r, g, b, a]`. `uv` is normalised 0..1 |
| `shader` | `{ vertexShader, fragmentShader, uniforms }` — the compiled GLSL |
| `nodes` | every node reachable from `renderer` |
| `width` / `height` | resolved canvas size |
| `set(name, value)` | write a raw uniform on the running material |
| `setAttribution({ x, y, text } \| null)` | show/hide a corner credit over the canvas (`x`: `'left' \| 'right'`, `y`: `'top' \| 'bottom'`) |

`App` is an `EventTarget`. The `frame` event fires once per animation frame
(and from `tick()`), before uniforms are synced, so a listener can push values:

```ts
const gain = new UniformNode('gain', 1);
app.addEventListener('frame', (e) => {
  // e.time  — seconds since run()
  // e.dt    — seconds since the previous frame
  // e.frame — 0-based frame counter
  gain.out.value.set(0.5 + 0.5 * Math.sin(e.time));
});
```

## Node API

A node is any object matching this contract — the built-ins have no privileges:

```ts
abstract class Node {
  abstract readonly kind: string;                  // label, for tooling
  abstract readonly in:  Readonly<Record<string, InputPort>>;
  abstract readonly out: Readonly<Record<string, OutputPort>>;

  abstract emit(ctx: CompileContext): Record<string, string>;   // GPU: one GLSL expr per output
  abstract compute(inputs: Record<string, Value>): Record<string, Value>; // CPU: pure, mirrors emit
}
```

`declareIn` / `declareOut` build the frozen port groups from a `{ name: GLType }`
spec. Inside `emit`, `ctx.resolve(this.in.x)` returns the GLSL expression feeding
an input, and `ctx.hoist(type, expr)` binds an expression to a temp variable
(computed once) and returns its name. `ctx.addHelper` / `ctx.addUniform` /
`ctx.require` register shared GLSL.

```ts
import { Node, type Src } from './src';
import type { CompileContext } from './src';

/** GLSL step(edge, x): 0 below the edge, 1 at or above it. */
export class StepNode extends Node {
  readonly kind = 'step';
  readonly in = this.declareIn({ edge: 'float', x: 'float' });
  readonly out = this.declareOut({ value: 'float' });

  constructor(edge?: Src<'float'>, x?: Src<'float'>) {
    super();
    if (edge !== undefined) this.in.edge.connect(edge);
    if (x !== undefined) this.in.x.connect(x);
  }

  emit(ctx: CompileContext) {
    const edge = ctx.resolve(this.in.edge);
    const x = ctx.resolve(this.in.x);
    return { value: ctx.hoist('float', `step(${edge}, ${x})`) };
  }

  compute(inputs: Record<string, unknown>) {
    return { value: (inputs.x as number) >= (inputs.edge as number) ? 1 : 0 };
  }
}
```

### Ports

- `in.<name>.connect(src)` — wire an input. `src` is an `OutputPort` or a
  single-output node. Throws on a type mismatch or a second connection.
- `out.<name>.value` — lazy CPU pull through the graph, cached per epoch;
  throws `cycle detected …` on a loop.
- `out.<name>.x` / `.y` / `.z` / `.w`, and `.xy` / `.xyz` / `.rgb` — swizzles,
  themselves output ports.
- Source ports (`TimeNode.out.t`, `UVNode.out.uv`, `UniformNode.out.value`,
  `Constant.out.value`) add `.set(v)` / `.setValue(v)` and `.current`.

### Built-in nodes

| category | nodes |
|----------|-------|
| input  | `TimeNode` `ViewportNode` `UVNode` `UniformNode` `Constant` |
| math   | `SinNode` `CosNode` `TanNode` `AtanNode` `AbsNode` `FloorNode` `FractNode` `SqrtNode` `AddNode` `SubNode` `MulNode` `DivNode` `MinNode` `MaxNode` `ModNode` `Atan2Node` `PowNode` `LengthNode` `DistanceNode` `SmoothstepNode` `ClampNode` `MixNode` |
| compose | `Vec2Node` `Vec3Node` `Vec4Node` |
| space  | `PolarNode` `CartesianNode` `Rotate3DNode` `PerspectiveNode` |
| raster | `TriangleNode` |
| signal | `SignalNode` (`.sample(x)` → `SampleNode`) |
| noise  | `NoiseNode` |
| output | `RendererNode` |

`compile(renderer)` runs the same pass `App` does and returns the
`CompiledShader` on its own if you only want the GLSL.

### Validation

`compile` (and therefore `new App`) first calls `assertValidGraph(renderer)`,
which walks the graph and throws `GraphValidationError` listing every problem:

- **cycles** — reported with the path, e.g. `cycle: sin#1.x → add#2.b → sin#1`
- **unconnected inputs** — e.g. `renderer.g is not connected`

Call `validateGraph(renderer)` yourself for the `GraphProblem[]` without throwing.

