import type { Src } from '../../src';
import {
  AddNode,
  Constant,
  CosNode,
  MulNode,
  PowNode,
  RendererNode,
  SinNode,
  SmoothstepNode,
  SubNode,
  TimeNode,
  UVNode,
  Vec2Node,
} from '../../src';
import { EscapeFractalNode } from './escape-fractal';

const TAU = Math.PI * 2;

// --- viewport ---
export const WIDTH = 640;
export const HEIGHT = 480;
export const ASPECT = WIDTH / HEIGHT;

// --- fractal ---
const SPAN = 3.0; // complex-plane height spanning the viewport
const ITERATIONS = 72;
const BAILOUT = 256;

// c drifts on a Lissajous path around the Mandelbrot boundary, so the Julia
// set morphs between connected shapes and dust.
export const C_CENTRE: readonly [number, number] = [-0.5, 0];
const C_RADIUS = 0.36;
const C_RATE_X = 1.3;
const C_RATE_Y = 1.7;

// --- colour ---
const BANDS = 20; // colour phase span across the escape range
const BAND_GAMMA = 0.55; // < 1 spreads the fast-escaping exterior into more bands
const HUE_DRIFT = 2.5; // rad/s

type F = Src<'float'>;
const f = (n: number) => new Constant(n);
const add = (a: F, b: F) => new AddNode(a, b);
const sub = (a: F, b: F) => new SubNode(a, b);
const mul = (a: F, b: F) => new MulNode(a, b);
const sin = (x: F) => new SinNode(x);
const cos = (x: F) => new CosNode(x);
const pow = (x: F, e: F) => new PowNode(x, e);
const smoothstep = (e0: F, e1: F, x: F) => new SmoothstepNode(e0, e1, x);
/** sine remapped from [-1, 1] to [0, 1] */
const unipolar = (x: F) => add(mul(x, f(0.5)), f(0.5));

/** A full-viewport animated Julia set: z → z² + c, coloured by escape time. */
export function julia(): { renderer: RendererNode } {
  const uv = new UVNode();
  const time = new TimeNode();
  const t = time.out.t;

  // pixel → point in the complex plane
  const zr = mul(sub(uv.out.uv.x, f(0.5)), f(ASPECT * SPAN));
  const zi = mul(sub(uv.out.uv.y, f(0.5)), f(SPAN));

  const cr = add(f(C_CENTRE[0]), mul(cos(mul(t, f(C_RATE_X))), f(C_RADIUS)));
  const ci = add(f(C_CENTRE[1]), mul(sin(mul(t, f(C_RATE_Y))), f(C_RADIUS)));

  const fractal = new EscapeFractalNode(
    new Vec2Node(zr, zi),
    new Vec2Node(cr, ci),
    { iterations: ITERATIONS, bailout: BAILOUT },
  );
  const esc = fractal.out.escape; // 0 = escaped instantly, 1 = never escaped

  // interior (never escaped) → black; exterior → escape-time bands
  const exterior = sub(f(1), smoothstep(f(0.995), f(1), esc));
  const bands = mul(pow(esc, f(BAND_GAMMA)), f(BANDS));
  const channel = (phase: number) =>
    mul(unipolar(sin(add(bands, add(f(phase), mul(t, f(HUE_DRIFT)))))), exterior);

  return {
    renderer: new RendererNode({
      r: channel(0),
      g: channel(TAU / 3),
      b: channel((2 * TAU) / 3),
    }),
  };
}
