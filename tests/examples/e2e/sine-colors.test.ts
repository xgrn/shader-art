import {
  AddNode,
  App,
  Constant,
  RendererNode,
  SinNode,
  TimeNode,
  compile,
} from '../../../src';

const TAU = Math.PI * 2;
const PHASES = [0, TAU / 3, (2 * TAU) / 3] as const;

function build() {
  const time = new TimeNode();
  const [r, g, b] = PHASES.map(
    (p) => new SinNode(new AddNode(time.out.t, new Constant(p))),
  );
  const renderer = new RendererNode({ r: r!, g: g!, b: b! });
  return { time, renderer };
}

describe('sine-colors example', () => {
  it('CPU: each channel is sin(time + phase), alpha opaque', () => {
    const app = new App(build().renderer, { width: 4, height: 4 });
    const c = app.sample({ time: 42 });
    expect(c[0]).toBeCloseTo(Math.sin(42 + PHASES[0]));
    expect(c[1]).toBeCloseTo(Math.sin(42 + PHASES[1]));
    expect(c[2]).toBeCloseTo(Math.sin(42 + PHASES[2]));
    expect(c[3]).toBe(1);
  });

  it('animates with time', () => {
    const app = new App(build().renderer, { width: 4, height: 4 });
    expect(app.sample({ time: 0 })).not.toEqual(app.sample({ time: 1 }));
  });

  it('swizzle: renderer.out.color.x tracks the red channel', () => {
    const { renderer } = build();
    const app = new App(renderer, { width: 4, height: 4 });
    app.sample({ time: 1.234 });
    expect(renderer.out.color.x.value).toBeCloseTo(Math.sin(1.234));
  });

  it('compiles to a fragment shader with the uTime uniform', () => {
    const { fragmentShader, uniforms } = compile(build().renderer);
    expect(fragmentShader).toContain('void main()');
    expect(fragmentShader).toContain('uniform float uTime;');
    expect(fragmentShader).toMatch(/gl_FragColor = vec4\(/);
    expect(uniforms).toHaveProperty('uTime');
  });

  it('App exposes the compiled shader and collected nodes', () => {
    const app = new App(build().renderer, { width: 4, height: 4 });
    expect(app.width).toBe(4);
    expect(app.nodes.map((n) => n.kind)).toContain('renderer');
    expect(app.nodes.filter((n) => n.kind === 'sin')).toHaveLength(3);
  });
});
