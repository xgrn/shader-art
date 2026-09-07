import type { Src } from '../../src';
import {
  AddNode,
  Constant,
  DivNode,
  MixNode,
  MulNode,
  NoiseNode,
  RendererNode,
  SubNode,
  TimeNode,
  UVNode,
  Vec2Node,
  ViewportNode,
} from '../../src';

// --- viewport --- (only needed by main.ts to size the canvas; the graph reads
// the actual size at runtime via ViewportNode)
export const WIDTH = 640;
export const HEIGHT = 480;

// --- field ---
const ZOOM = 3.0; // noise units spanning the viewport height
const OCTAVES = 5;
const WARP_1 = 3.6; // how hard the first fBm layer bends the domain
const WARP_2 = 3.0; // ... and the second
const FLOW = 0.09; // domain drift, units/s

type F = Src<'float'>;
type V2 = Src<'vec2'>;
type V3 = Src<'vec3'>;

const f = (n: number) => new Constant(n);
const rgb = (r: number, g: number, b: number) => new Constant([r, g, b] as const);
const v2 = (a: F, b: F) => new Vec2Node(a, b);
const addF = (a: F, b: F) => new AddNode(a, b);
const add2 = (a: V2, b: V2) => new AddNode(a, b);
const mul = (a: F, b: F) => new MulNode(a, b);
const scale2 = (p: V2, s: F) => new MulNode(p, s); // vec2 * float
const mix3 = (a: V3, b: V3, tt: F) => new MixNode(a, b, tt);
/** noise remapped from ≈[-1, 1] to ≈[0, 1] */
const unipolar = (x: F) => addF(mul(x, f(0.5)), f(0.5));
const fbm = (p: V2) => new NoiseNode(p, { octaves: OCTAVES });

/** Domain-warped fBm — `fbm(p + fbm(p + fbm(p)))` — a flowing, non-repeating field. */
export function domainWarp(): { renderer: RendererNode } {
  const uv = new UVNode();
  const t = new TimeNode().out.t;
  const viewport = new ViewportNode();
  const aspect = new DivNode(viewport.out.size.x, viewport.out.size.y);

  const p = v2(
    mul(new SubNode(uv.out.uv.x, f(0.5)), mul(aspect, f(ZOOM))),
    mul(new SubNode(uv.out.uv.y, f(0.5)), f(ZOOM)),
  );
  const pf = add2(p, v2(mul(t, f(FLOW)), mul(t, f(FLOW * 0.7))));

  // first warp:  q = (fbm(p), fbm(p + offset))
  const qx = fbm(pf);
  const qy = fbm(add2(pf, v2(f(5.2), f(1.3))));

  // second warp:  r = (fbm(p + w1·q), fbm(p + w1·q + offset))
  const pq = add2(p, scale2(v2(qx, qy), f(WARP_1)));
  const rx = fbm(pq);
  const ry = fbm(add2(pq, v2(f(8.3), f(2.8))));

  // final field
  const n = fbm(add2(p, scale2(v2(rx, ry), f(WARP_2))));

  // colour: layered tints keyed by the warp components, lit by the final field
  const tint = mix3(
    mix3(rgb(0.05, 0.12, 0.38), rgb(0.95, 0.5, 0.15), unipolar(qx)),
    rgb(0.92, 0.96, 1.0),
    mul(unipolar(rx), f(0.6)),
  );
  const lit = new MulNode(tint, addF(f(0.5), mul(unipolar(n), f(0.55))));

  return {
    renderer: new RendererNode({
      r: lit.out.value.x,
      g: lit.out.value.y,
      b: lit.out.value.z,
    }),
  };
}
