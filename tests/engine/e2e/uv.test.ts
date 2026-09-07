import { App, Constant, RendererNode, UVNode, compile } from '../../../src';

function build() {
  const uv = new UVNode();
  const renderer = new RendererNode({
    r: uv.out.uv.x,
    g: uv.out.uv.y,
    b: new Constant(0),
  });
  return { uv, renderer };
}

describe('UVNode', () => {
  it('outputs a settable vec2, default [0, 0]', () => {
    const uv = new UVNode();
    expect(uv.out.uv.type).toBe('vec2');
    expect(uv.out.uv.value).toEqual([0, 0]);
  });

  it('.x / .y swizzle to floats', () => {
    const uv = new UVNode();
    uv.out.uv.setValue([0.25, 0.75]);
    expect(uv.out.uv.x.value).toBe(0.25);
    expect(uv.out.uv.y.value).toBe(0.75);
  });

  it('App.sample({ uv }) drives the per-pixel colour', () => {
    const app = new App(build().renderer, { width: 4, height: 4 });
    expect(app.sample({ uv: [0.3, 0.7] })).toEqual([0.3, 0.7, 0, 1]);
    expect(app.sample({ uv: [0.9, 0.1] })).toEqual([0.9, 0.1, 0, 1]);
  });

  it('compiles the swizzles to vUv.x / vUv.y', () => {
    const { fragmentShader } = compile(build().renderer);
    expect(fragmentShader).toContain('varying vec2 vUv;');
    expect(fragmentShader).toMatch(/gl_FragColor = vec4\(vUv\.x, vUv\.y, 0\.0, 1\.0\)/);
  });
});
