import { Constant, CosNode, SinNode, TimeNode } from '../../../src';

describe('SinNode', () => {
  it('computes sin(x) in isolation', () => {
    expect(new SinNode().compute({ x: 1.5 })).toEqual({ value: Math.sin(1.5) });
  });
});

describe('CosNode', () => {
  it('computes cos(x) in isolation', () => {
    expect(new CosNode().compute({ x: 1.5 })).toEqual({ value: Math.cos(1.5) });
  });

  it('wires positionally and pulls through', () => {
    const cos = new CosNode(new Constant(Math.PI));
    expect(cos.out.value.value).toBeCloseTo(-1);
  });
});

describe('Constant', () => {
  it('infers float from a number', () => {
    const c = new Constant(3);
    expect(c.out.value.type).toBe('float');
    expect(c.out.value.value).toBe(3);
  });

  it('infers vec3 from a 3-tuple', () => {
    const c = new Constant([1, 2, 3] as const);
    expect(c.out.value.type).toBe('vec3');
  });
});

describe('TimeNode', () => {
  it('holds a settable value, default 0', () => {
    const t = new TimeNode();
    expect(t.out.t.value).toBe(0);
    t.out.t.setValue(5);
    expect(t.out.t.value).toBe(5);
  });
});
