import { App } from '../../../src';
import { HEIGHT, WIDTH, julia } from '../../../examples/julia/graph';

const lum = (c: readonly number[]) => (c[0]! + c[1]! + c[2]!) / 3;

describe('julia example', () => {
  it('compiles to an escape-time loop', () => {
    const { fragmentShader } = new App(julia().renderer, { width: WIDTH, height: HEIGHT }).shader;
    expect(fragmentShader).toMatch(/for \(int i = 0; i < 72; i\+\+\)/);
    expect(fragmentShader).toContain('escape_72');
    expect(fragmentShader).toContain('uniform float uTime;');
  });

  it('interior is dark, exterior is coloured, and it animates', () => {
    const app = new App(julia().renderer, { width: 16, height: 16 });

    // at t = 0, c ≈ (-0.14, 0) is well inside the Mandelbrot set, so z0 = 0 is
    // in the filled Julia set -> the centre pixel never escapes -> black.
    expect(lum(app.sample({ time: 0, uv: [0.5, 0.5] }))).toBeLessThan(0.05);

    // a pixel far out escapes immediately -> a bright escape band
    expect(lum(app.sample({ time: 0, uv: [0.06, 0.06] }))).toBeGreaterThan(0.1);

    // an exterior pixel: same escape band, but the palette drifts with time
    const p = [0.88, 0.12] as const;
    expect(lum(app.sample({ time: 0, uv: p }))).toBeGreaterThan(0.05);
    expect(app.sample({ time: 0, uv: p })).not.toEqual(app.sample({ time: 4, uv: p }));
  });
});
