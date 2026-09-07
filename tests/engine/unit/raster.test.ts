import {
  Constant,
  PerspectiveNode,
  RendererNode,
  Rotate3DNode,
  TriangleNode,
  compile,
} from '../../../src';

describe('Rotate3DNode', () => {
  it('rotates a vec3 about a principal axis', () => {
    const r = new Rotate3DNode(undefined, undefined, 'z');
    const out = r.compute({ v: [1, 0, 0], angle: Math.PI / 2 }).value as readonly number[];
    expect(out[0]).toBeCloseTo(0);
    expect(out[1]).toBeCloseTo(1);
    expect(out[2]).toBeCloseTo(0);
  });

  it('a full turn is the identity', () => {
    const r = new Rotate3DNode(undefined, undefined, 'y');
    const out = r.compute({ v: [0.3, -0.7, 0.4], angle: Math.PI * 2 }).value as readonly number[];
    expect(out[0]).toBeCloseTo(0.3);
    expect(out[1]).toBeCloseTo(-0.7);
    expect(out[2]).toBeCloseTo(0.4);
  });
});

describe('PerspectiveNode', () => {
  it('divides xy by z, keeps z', () => {
    const p = new PerspectiveNode(undefined, 2);
    expect(p.compute({ v: [1, 2, 4] }).value).toEqual([0.5, 1, 4]);
  });
});

describe('TriangleNode', () => {
  const tri = () =>
    new TriangleNode({}, { softness: 0.001 });

  it('covers a point inside, misses one outside', () => {
    const t = tri();
    const inside = t.compute({
      a: [0, 0, 1],
      b: [1, 0, 1],
      c: [0, 1, 1],
      tint: [1, 1, 1],
      uv: [0.2, 0.2],
    });
    const outside = t.compute({
      a: [0, 0, 1],
      b: [1, 0, 1],
      c: [0, 1, 1],
      tint: [1, 1, 1],
      uv: [0.9, 0.9],
    });
    expect((inside.colour as readonly number[])[3]).toBeCloseTo(1);
    expect((outside.colour as readonly number[])[3]).toBeCloseTo(0);
  });

  it('interpolates depth barycentrically', () => {
    const t = tri();
    const at = t.compute({
      a: [0, 0, 2],
      b: [1, 0, 4],
      c: [0, 1, 6],
      tint: [1, 1, 1],
      uv: [0.5, 0.5],
    });
    expect(at.depth as number).toBeCloseTo(2 * 0 + 4 * 0.5 + 6 * 0.5);
  });

  it('compiles to the barycentric helper', () => {
    const v = (x: number, y: number, z: number) =>
      new PerspectiveNode(new Constant([x, y, z] as const), 2);
    const tri2 = new TriangleNode({
      a: v(-1, -1, 4),
      b: v(1, -1, 4),
      c: v(0, 1, 4),
      tint: new Constant([1, 0, 0] as const),
      uv: new Constant([0, 0] as const),
    });
    const renderer = new RendererNode({
      r: tri2.out.colour.w,
      g: tri2.out.depth,
      b: new Constant(0),
    });
    const { fragmentShader } = compile(renderer);
    expect(fragmentShader).toContain('vec3 sa_bary(vec2 a, vec2 b, vec2 c, vec2 p)');
    expect(fragmentShader).toContain('sa_bary(');
  });
});
