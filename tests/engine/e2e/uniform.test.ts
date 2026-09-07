import {
  App,
  Constant,
  FrameEvent,
  MulNode,
  RendererNode,
  UniformNode,
  compile,
} from '../../../src';

function build(u: UniformNode) {
  return new RendererNode({
    r: u.out.value,
    g: new Constant(0),
    b: new Constant(0),
  });
}

describe('UniformNode', () => {
  it('exposes a settable output port', () => {
    const u = new UniformNode('gain', 1);
    expect(u.out.value.value).toBe(1);
    u.out.value.set(0.5);
    expect(u.out.value.value).toBe(0.5);
  });

  it('compiles to a uniform declaration and reference', () => {
    const u = new UniformNode('gain', 0.25);
    const { fragmentShader, uniforms } = compile(build(u));
    expect(fragmentShader).toContain('uniform float gain;');
    expect(fragmentShader).toContain('gl_FragColor = vec4(gain,');
    expect(uniforms.gain).toEqual({ value: 0.25 });
  });

  it('drives the CPU sample', () => {
    const u = new UniformNode('gain', 0);
    const app = new App(build(u), { width: 2, height: 2 });
    u.out.value.set(0.7);
    expect(app.sample()[0]).toBe(0.7);
  });

  it('auto-names when no name is given', () => {
    const a = new UniformNode();
    const b = new UniformNode();
    expect(a.uniformName).not.toBe(b.uniformName);
    expect(a.uniformName).toMatch(/^u_\d+$/);
  });
});

describe('App frame event', () => {
  it('is an EventTarget that dispatches FrameEvent from tick()', () => {
    const app = new App(build(new UniformNode()), { width: 2, height: 2 });
    const events: FrameEvent[] = [];
    app.addEventListener('frame', (e) => events.push(e));

    app.tick(0);
    app.tick(0.5);

    expect(events).toHaveLength(2);
    expect(events[0]).toBeInstanceOf(FrameEvent);
    expect(events[1]!.time).toBe(0.5);
    expect(events[1]!.dt).toBeCloseTo(0.5);
    expect(events[1]!.frame).toBe(1);
  });

  it('a frame listener can drive a uniform, visible to sample()', () => {
    const u = new UniformNode('level');
    const app = new App(build(u), { width: 2, height: 2 });
    app.addEventListener('frame', (e) => u.out.value.set(e.time * 0.2));

    app.tick(3);
    expect(app.sample()[0]).toBeCloseTo(0.6);
  });
});
