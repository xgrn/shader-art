import { App } from '../../../src';
import {
  ASPECT,
  HEIGHT,
  ORBIT_RADIUS,
  WAVE_AMPLITUDE,
  WAVE_POINTS,
  WIDTH,
  orbitingDot,
} from '../../../examples/orbiting-dot/graph';

const lum = (c: readonly number[]) => (c[0]! + c[1]! + c[2]!) / 3;
const app = () => new App(orbitingDot().renderer, { width: WIDTH, height: HEIGHT });

const onRing = (radius: number, theta: number) =>
  [
    0.5 + (radius * Math.cos(theta)) / ASPECT,
    0.5 + radius * Math.sin(theta),
  ] as const;

describe('orbiting-dot', () => {
  it('compiles to the expected GLSL', () => {
    const { fragmentShader } = app().shader;
    expect(fragmentShader).toContain('void main()');
    expect(fragmentShader).toContain('atan(');
    expect(fragmentShader).toContain('length(');
    expect(fragmentShader).toContain('clamp(');
    expect(fragmentShader).toContain('mod(');
    expect(fragmentShader).toContain('smoothstep(');
    expect(fragmentShader).toMatch(/uniform float sig_\d+\[\d+\];/);
    expect(fragmentShader).toMatch(/float sig_\d+_at\(float x\)/);
  });

  it('the dot is bright, the centre is dark at t = 0', () => {
    const a = app();
    const atDot = a.sample({ time: 0, uv: [0.5 + ORBIT_RADIUS / ASPECT, 0.5] });
    const atCentre = a.sample({ time: 0, uv: [0.5, 0.5] });
    expect(lum(atDot)).toBeGreaterThan(0.1);
    expect(lum(atCentre)).toBeLessThan(0.02);
  });

  it('animates: a point on the orbit ring changes as the tail sweeps past', () => {
    const a = app();
    const uv = onRing(ORBIT_RADIUS, -0.6); // just behind where the dot starts at t = 0
    const c0 = a.sample({ time: 0, uv });
    const c1 = a.sample({ time: 1.3, uv });
    expect(lum(c0)).toBeGreaterThan(0.05);
    expect(c0).not.toEqual(c1);
  });

  it('the waveform displaces the tail radially', () => {
    const { renderer, wave } = orbitingDot();
    const a = new App(renderer, { width: WIDTH, height: HEIGHT });
    const uv = onRing(ORBIT_RADIUS + 0.5 * WAVE_AMPLITUDE, -0.5);

    const flat = a.sample({ time: 0, uv }); // signal is all zeros -> tail on the ring
    wave.set(new Float32Array(WAVE_POINTS).fill(0.5)); // push the whole tail outward
    const pushed = a.sample({ time: 0, uv });

    expect(lum(pushed)).toBeGreaterThan(lum(flat) + 0.05);
  });
});
