import { App, Constant, RendererNode, ViewportNode, compile } from '../../../src';

describe('ViewportNode', () => {
  it('defaults to [1, 1] and is settable', () => {
    const vp = new ViewportNode();
    expect(vp.out.size.value).toEqual([1, 1]);
    vp.out.size.setValue([320, 240]);
    expect(vp.out.size.value).toEqual([320, 240]);
  });

  it('compiles to the uResolution builtin', () => {
    const vp = new ViewportNode();
    const renderer = new RendererNode({
      r: vp.out.size.x,
      g: vp.out.size.y,
      b: new Constant(0),
    });
    const { fragmentShader, uniforms } = compile(renderer);
    expect(fragmentShader).toContain('uniform vec2 uResolution;');
    expect(fragmentShader).toMatch(/gl_FragColor = vec4\(uResolution\.x, uResolution\.y,/);
    expect(uniforms).toHaveProperty('uResolution');
  });

  it('the App feeds the actual canvas size', () => {
    const vp = new ViewportNode();
    const renderer = new RendererNode({
      r: vp.out.size.x,
      g: vp.out.size.y,
      b: new Constant(0),
    });
    const app = new App(renderer, { width: 800, height: 600 });
    const c = app.sample();
    expect(c[0]).toBe(800);
    expect(c[1]).toBe(600);
  });
});
