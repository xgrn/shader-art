import type { SingleOutputNode, Src } from '../../src';
import {
  AddNode,
  Constant,
  DivNode,
  MixNode,
  MulNode,
  PerspectiveNode,
  RendererNode,
  Rotate3DNode,
  SmoothstepNode,
  SubNode,
  TimeNode,
  TriangleNode,
  UVNode,
  Vec2Node,
  ViewportNode,
} from '../../src';
import { FACES, VERTICES, type Vec3 } from './geometry';

// --- viewport ---
export const WIDTH = 640;
export const HEIGHT = 480;

// --- scene ---
const DIST = 4.2; // push the cube back along +z
const FOV = 2.2; // projection scale
const VIEW = 2.0; // projected half-height shown across the viewport
const START: readonly [number, number, number] = [0.55, 0.7, 0.12]; // initial angles
const SPIN: readonly [number, number, number] = [1.2, 0.78, 0.39]; // rad/s about x, y, z
const EDGE_SOFTNESS = 0.0015;
export const BACKGROUND: Vec3 = [0.04, 0.05, 0.09];

type F = Src<'float'>;
type V3 = SingleOutputNode<'vec3'>;

const f = (n: number) => new Constant(n);
const v3 = (t: Vec3) => new Constant(t);
const mul = (a: F, b: F) => new MulNode(a, b);
const mixVec3 = (a: Src<'vec3'>, b: Src<'vec3'>, tt: F) => new MixNode(a, b, tt);
/** ≈ 1 when `x < edge`, 0 otherwise — a near-hard depth test for crisp edges. */
const nearer = (edge: F, x: F) =>
  new SmoothstepNode(f(-0.05), f(0.05), new SubNode(edge, x));

/** A cube spinning on all three axes — geometry transformed entirely in the graph. */
export function cube(): { renderer: RendererNode } {
  const uv = new UVNode();
  const t = new TimeNode().out.t;
  const vp = new ViewportNode();
  const aspect = new DivNode(vp.out.size.x, vp.out.size.y);

  // pixel → the same screen space the projected vertices land in
  const screen = new MulNode(
    new SubNode(uv.out.uv, f(0.5)),
    new Vec2Node(mul(aspect, f(2 * VIEW)), f(2 * VIEW)),
  );

  const ax = new AddNode(f(START[0]), mul(t, f(SPIN[0])));
  const ay = new AddNode(f(START[1]), mul(t, f(SPIN[1])));
  const az = new AddNode(f(START[2]), mul(t, f(SPIN[2])));

  // per vertex: rotate x → y → z, translate back, project
  const projected = VERTICES.map((vtx) => {
    const spun = new Rotate3DNode(
      new Rotate3DNode(new Rotate3DNode(v3(vtx), ax, 'x'), ay, 'y'),
      az,
      'z',
    );
    return new PerspectiveNode(new AddNode(spun, v3([0, 0, DIST])), FOV);
  });

  // rasterise every triangle; composite with a nearest-depth blend
  let colour: V3 = v3(BACKGROUND);
  let best: SingleOutputNode<'float'> = f(1e4);

  for (const face of FACES) {
    for (const [i, j, k] of face.tris) {
      const tri = new TriangleNode(
        {
          a: projected[i]!,
          b: projected[j]!,
          c: projected[k]!,
          tint: v3(face.colour),
          uv: screen,
        },
        { softness: EDGE_SOFTNESS },
      );
      const covered = mul(
        tri.out.colour.w, // coverage
        nearer(best.out.value, tri.out.depth),
      );
      colour = mixVec3(colour.out.value, tri.out.colour.rgb, covered);
      best = new MixNode(best.out.value, tri.out.depth, covered);
    }
  }

  return {
    renderer: new RendererNode({
      r: colour.out.value.x,
      g: colour.out.value.y,
      b: colour.out.value.z,
    }),
  };
}
