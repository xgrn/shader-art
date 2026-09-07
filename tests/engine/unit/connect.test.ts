import { AddNode, Constant, RendererNode, SinNode } from '../../../src';

describe('connecting ports', () => {
  it('rejects a second connection to the same input', () => {
    const sin = new SinNode();
    sin.in.x.connect(new Constant(1));
    expect(() => sin.in.x.connect(new Constant(2))).toThrow(/already connected/);
  });

  it('errors when an unconnected input is evaluated', () => {
    const sin = new SinNode();
    expect(() => sin.out.value.value).toThrow(/not connected/);
  });

  it('runtime-guards a GLType mismatch', () => {
    const renderer = new RendererNode();
    const vec = new Constant([0, 0]);
    expect(() => {
      // @ts-expect-error - vec2 into a float input; also verify the runtime guard
      renderer.in.r.connect(vec);
    }).toThrow(/cannot wire/);
  });

  it('constructor args wire inputs positionally', () => {
    const sum = new AddNode(new Constant(2), new Constant(1));
    expect(sum.out.value.value).toBe(3);
    expect(new SinNode(sum).out.value.value).toBe(Math.sin(3));
  });
});
