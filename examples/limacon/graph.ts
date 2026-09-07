import type { Src } from '../../src';
import {
  AbsNode,
  AddNode,
  ClampNode,
  Constant,
  CosNode,
  MinNode,
  MixNode,
  MulNode,
  PolarNode,
  RendererNode,
  SinNode,
  SmoothstepNode,
  SubNode,
  TimeNode,
  UVNode,
  Vec2Node,
} from '../../src';

const TAU = Math.PI * 2;

// --- viewport ---
export const WIDTH = 640;
export const HEIGHT = 480;
export const ASPECT = WIDTH / HEIGHT;

// --- limaçon ---
export const SCALE = 2.6; // world units spanning the viewport height
export const B = 0.36; // fixed parameter
export const A_BASE = 0.44; // a oscillates A_BASE ± A_SWING ...
export const A_SWING = 0.28; //   ... crossing a = b (the cardioid) each cycle
export const POLE_X = 0.34; // shift the polar pole left so the figure sits centred
const A_RATE = 1.4; // rad/s of the a-oscillation
const SPIN = 0.2; // rad/s rotation of the whole figure
const LINE_WIDTH = 0.16; // line half-thickness, in world units

type F = Src<'float'>;
const f = (n: number) => new Constant(n);
const add = (a: F, b: F) => new AddNode(a, b);
const sub = (a: F, b: F) => new SubNode(a, b);
const mul = (a: F, b: F) => new MulNode(a, b);
const sin = (x: F) => new SinNode(x);
const cos = (x: F) => new CosNode(x);
const abs = (x: F) => new AbsNode(x);
const smoothstep = (e0: F, e1: F, x: F) => new SmoothstepNode(e0, e1, x);
const min = (a: F, b: F) => new MinNode(a, b);
const clamp = (x: F, lo: F, hi: F) => new ClampNode(x, lo, hi);
/** sine remapped from [-1, 1] to [0, 1] */
const unipolar = (x: F) => add(mul(x, f(0.5)), f(0.5));

/**
 * The limaçon of Pascal, r = b + a·cos θ, drawn as an implicit curve in polar
 * coordinates. `a` breathes up and down through `a = b`, morphing the figure
 * between a dimpled limaçon, a cardioid, and a limaçon with an inner loop.
 */
export function limacon(): { renderer: RendererNode } {
  const uv = new UVNode();
  const time = new TimeNode();
  const t = time.out.t;

  // pixel → world (aspect-corrected, pole shifted) → polar
  const px = add(mul(sub(uv.out.uv.x, f(0.5)), f(ASPECT * SCALE)), f(POLE_X));
  const py = mul(sub(uv.out.uv.y, f(0.5)), f(SCALE));
  const polar = new PolarNode(new Vec2Node(px, py));
  const r = polar.out.radius;
  const angle = sub(polar.out.angle, mul(t, f(SPIN))); // rotate the figure

  const a = add(f(A_BASE), mul(sin(mul(t, f(A_RATE))), f(A_SWING)));
  const b = f(B);
  const aCos = mul(a, cos(angle));

  // a pixel is on the curve via  r = b + a·cos θ,  or (inner loop)  r = a·cos θ − b.
  // Each branch is a hard step at its target = 0, so the two ends meet cleanly
  // at the pole instead of fading into a wedge.
  const outer = add(b, aCos);
  const inner = sub(aCos, b);
  const dOuter = new MixNode(f(9), abs(sub(r, outer)), smoothstep(f(-0.01), f(0.01), outer));
  const dInner = new MixNode(f(9), abs(sub(r, inner)), smoothstep(f(-0.01), f(0.01), inner));
  const field = min(dOuter, dInner);

  const w = f(LINE_WIDTH);
  const linePart = smoothstep(w, f(0), field);
  const glow = smoothstep(mul(w, f(2.2)), f(0), field);
  const bright = clamp(add(linePart, mul(glow, f(0.15))), f(0), f(1));

  const hue = add(angle, mul(t, f(1.2))); // full colour cycle around the curve
  const channel = (phase: number) => mul(unipolar(sin(add(hue, f(phase)))), bright);

  return {
    renderer: new RendererNode({
      r: channel(0),
      g: channel(TAU / 3),
      b: channel((2 * TAU) / 3),
    }),
  };
}
