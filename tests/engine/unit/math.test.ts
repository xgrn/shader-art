import {
  AddNode,
  Atan2Node,
  AtanNode,
  ClampNode,
  Constant,
  DistanceNode,
  DivNode,
  LengthNode,
  MixNode,
  ModNode,
  MulNode,
  RendererNode,
  SinNode,
  SmoothstepNode,
  SubNode,
  TanNode,
  TimeNode,
  UVNode,
  Vec2Node,
  compile,
} from '../../../src';

describe('arithmetic nodes', () => {
  it('add / sub / mul / div compute in isolation', () => {
    expect(new AddNode().compute({ a: 2, b: 3 })).toEqual({ value: 5 });
    expect(new SubNode().compute({ a: 2, b: 3 })).toEqual({ value: -1 });
    expect(new MulNode().compute({ a: 2, b: 3 })).toEqual({ value: 6 });
    expect(new DivNode().compute({ a: 6, b: 3 })).toEqual({ value: 2 });
  });

  it('a scalar broadcasts against a vector', () => {
    const mul = new MulNode(new UVNode().out.uv, new Constant(2));
    expect(mul.out.value.type).toBe('vec2');
    expect(mul.compute({ a: [0.5, 0.25], b: 2 })).toEqual({ value: [1, 0.5] });
  });

  it('vec2 + vec3 has no common type and throws at construction', () => {
    const a = new Constant([1, 2]);
    const b = new Constant([1, 2, 3]);
    expect(() => new AddNode(a, b)).toThrow(/no common GLType/);
  });

  it('mod is floored division, not JS %', () => {
    expect(new ModNode().compute({ a: -1, b: 3 })).toEqual({ value: 2 });
  });
});

describe('trig nodes', () => {
  it('tan / atan / atan2', () => {
    expect(new TanNode().compute({ x: 1 })).toEqual({ value: Math.tan(1) });
    expect(new AtanNode().compute({ x: 1 })).toEqual({ value: Math.atan(1) });
    expect(new Atan2Node().compute({ y: 1, x: 1 })).toEqual({
      value: Math.atan2(1, 1),
    });
  });
});

describe('vector + interpolation nodes', () => {
  it('Vec2Node packs two floats', () => {
    expect(new Vec2Node().compute({ x: 1, y: 2 })).toEqual({ value: [1, 2] });
  });

  it('LengthNode / DistanceNode', () => {
    expect(new LengthNode().compute({ v: [3, 4] })).toEqual({ value: 5 });
    expect(new DistanceNode().compute({ a: [0, 0], b: [3, 4] })).toEqual({ value: 5 });
  });

  it('SmoothstepNode clamps then eases', () => {
    expect(new SmoothstepNode().compute({ edge0: 0, edge1: 1, x: -1 })).toEqual({ value: 0 });
    expect(new SmoothstepNode().compute({ edge0: 0, edge1: 1, x: 2 })).toEqual({ value: 1 });
    expect(new SmoothstepNode().compute({ edge0: 0, edge1: 1, x: 0.5 })).toEqual({ value: 0.5 });
  });

  it('ClampNode', () => {
    expect(new ClampNode().compute({ x: 5, lo: 0, hi: 1 })).toEqual({ value: 1 });
    expect(new ClampNode().compute({ x: -3, lo: 0, hi: 1 })).toEqual({ value: 0 });
  });

  it('MixNode blends floats and vectors', () => {
    expect(new MixNode().compute({ a: 0, b: 10, t: 0.25 })).toEqual({ value: 2.5 });
    const m = new MixNode(
      new Constant([0, 0, 0]),
      new Constant([2, 4, 6]),
      new Constant(0.5),
    );
    expect(m.out.value.type).toBe('vec3');
    expect(m.out.value.value).toEqual([1, 2, 3]);
  });
});

describe('compile', () => {
  it('emits GLSL operators and function calls', () => {
    const uv = new UVNode();
    const scaled = new MulNode(uv.out.uv.x, new Constant(8));
    const wave = new SinNode(new AddNode(scaled, new TimeNode().out.t));
    const renderer = new RendererNode({
      r: wave,
      g: new Constant(0),
      b: new Constant(0),
    });
    const { fragmentShader } = compile(renderer);
    expect(fragmentShader).toContain('(vUv.x * 8.0)');
    expect(fragmentShader).toContain('sin(');
    expect(fragmentShader).toContain('uniform float uTime;');
  });
});
