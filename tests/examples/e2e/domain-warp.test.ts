import { App } from '../../../src';
import { HEIGHT, WIDTH, domainWarp } from '../../../examples/domain-warp/graph';

describe('domain-warp example', () => {
  it('compiles with the noise helpers and time uniform', () => {
    const { fragmentShader } = new App(domainWarp().renderer, {
      width: WIDTH,
      height: HEIGHT,
    }).shader;
    expect(fragmentShader).toContain('sa_valueNoise');
    expect(fragmentShader).toContain('uniform float uTime;');
  });

  it('produces a varied field that animates', () => {
    const app = new App(domainWarp().renderer, { width: 8, height: 8 });
    expect(app.sample({ time: 0, uv: [0.3, 0.35] })).not.toEqual(
      app.sample({ time: 0, uv: [0.7, 0.62] }),
    );
    const p = [0.5, 0.5] as const;
    expect(app.sample({ time: 0, uv: p })).not.toEqual(app.sample({ time: 5, uv: p }));
  });
});
