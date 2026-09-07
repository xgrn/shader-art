import type { Src } from '../../src';
import {
  AddNode,
  ClampNode,
  Constant,
  LengthNode,
  MixNode,
  ModNode,
  MulNode,
  PolarNode,
  RendererNode,
  SignalNode,
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

// --- geometry, in the aspect-corrected, centre-origin coordinate space ---
const UV_CENTRE = 0.5;
export const ORBIT_RADIUS = 0.32; // distance of the dot from the centre
const ORBIT_SPEED = 1.8; // radians per second

// --- comet ---
export const DOT_RADIUS = 0.026; // radius of the round head (also the head-end tail width)
const TAIL_LENGTH = TAU * 0.9; // radians of arc the tail spans — almost the full circle
const TAIL_TIP_WIDTH = DOT_RADIUS * 0.3; // tail half-width at the far tip
const TAIL_END_GLOW = 0.12; // brightness at the far tip, relative to the head

// --- waveform ---
export const WAVE_POINTS = 128; // samples of the track fed to the tail each frame
export const WAVE_AMPLITUDE = DOT_RADIUS * 2.4; // how far ±1 of the waveform pushes the tail

// --- colour ---
const HUE_PER_RADIAN = 0.55; // hue cycles as the dot orbits
const HUE_DRIFT = 0.08; // extra hue cycle per second
const CHANNEL_PHASE = TAU / 3; // R / G / B are a third of a cycle apart

type F = Src<'float'>;
const f = (n: number) => new Constant(n);
const add = (a: F, b: F) => new AddNode(a, b);
const sub = (a: F, b: F) => new SubNode(a, b);
const mul = (a: F, b: F) => new MulNode(a, b);
const sin = (x: F) => new SinNode(x);
const clamp = (x: F, lo: F, hi: F) => new ClampNode(x, lo, hi);
const smoothstep = (e0: F, e1: F, x: F) => new SmoothstepNode(e0, e1, x);
const mix = (a: F, b: F, tt: F) => new MixNode(a, b, tt);
/** sine remapped from [-1, 1] to [0, 1] */
const unipolar = (x: F) => add(mul(x, f(0.5)), f(0.5));

/**
 * The comet is defined entirely in polar coordinates. `PolarNode` transforms
 * the pixel into (radius, angle); everything downstream works in that space.
 */
export function orbitingDot(): { renderer: RendererNode; wave: SignalNode } {
  const uv = new UVNode();
  const time = new TimeNode();
  const t = time.out.t;
  const wave = new SignalNode(WAVE_POINTS);

  // pixel → aspect-corrected, centred → polar
  const px = mul(sub(uv.out.uv.x, f(UV_CENTRE)), f(ASPECT));
  const py = sub(uv.out.uv.y, f(UV_CENTRE));
  const polar = new PolarNode(new Vec2Node(px, py));
  const radius = polar.out.radius;
  const angle = polar.out.angle;

  const spin = mul(t, f(ORBIT_SPEED));
  const orbit = f(ORBIT_RADIUS);

  // angular distance behind the dot, [0, 2π): 0 at the head, wrapping near the tip
  const rawBack = new ModNode(sub(spin, angle), f(TAU));
  const arc = clamp(rawBack, f(0), f(TAIL_LENGTH));
  const back = mul(arc, f(1 / TAIL_LENGTH)); // 0 at the head, 1 at the tip

  // the tail centre-line: the orbit ring displaced radially by the waveform
  const centreRadius = add(orbit, mul(wave.sample(back), f(WAVE_AMPLITUDE)));

  // distance to that centre-line — a capsule, so both ends are round caps
  const tangential = mul(sub(rawBack, arc), orbit);
  const radial = sub(radius, centreRadius);
  const dist = new LengthNode(new Vec2Node(tangential, radial));

  const along = sub(f(1), back); // 1 at the head, 0 at the tip
  const width = mix(f(TAIL_TIP_WIDTH), f(DOT_RADIUS), mul(along, along));
  const brightness = mix(f(TAIL_END_GLOW), f(1), along);
  const glow = mul(smoothstep(width, f(0), dist), brightness);

  // one hue for the whole comet, cycling as the dot orbits
  const hue = add(mul(spin, f(HUE_PER_RADIAN)), mul(t, f(HUE_DRIFT)));
  const channel = (phase: number) => mul(unipolar(sin(add(hue, f(phase)))), glow);

  const renderer = new RendererNode({
    r: channel(0),
    g: channel(CHANNEL_PHASE),
    b: channel(2 * CHANNEL_PHASE),
  });

  return { renderer, wave };
}
