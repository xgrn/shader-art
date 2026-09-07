import { App } from '../../../src';
import {
  A_BASE,
  ASPECT,
  B,
  HEIGHT,
  POLE_X,
  SCALE,
  WIDTH,
  limacon,
} from '../../../examples/limacon/graph';

const lum = (c: readonly number[]) => (c[0]! + c[1]! + c[2]!) / 3;
const app = () => new App(limacon().renderer, { width: WIDTH, height: HEIGHT });

const uvAt = (r: number, theta: number) =>
  [
    0.5 + (r * Math.cos(theta) - POLE_X) / (ASPECT * SCALE),
    0.5 + (r * Math.sin(theta)) / SCALE,
  ] as const;

describe('limaçon', () => {
  it('compiles', () => {
    const { fragmentShader } = app().shader;
    expect(fragmentShader).toContain('void main()');
    expect(fragmentShader).toContain('atan('); // PolarNode
    expect(fragmentShader).toContain('cos(');
    expect(fragmentShader).toContain('min(');
    expect(fragmentShader).toContain('uniform float uTime;');
  });

  it('the bright curve sits where r = b + a·cos θ  (t = 0)', () => {
    const a = app();
    for (let deg = 0; deg < 360; deg += 20) {
      const theta = (deg * Math.PI) / 180;
      const r = B + A_BASE * Math.cos(theta); // sin(0) = 0 -> a = A_BASE
      if (r < 0.15) continue; // near / behind the origin

      const on = a.sample({ time: 0, uv: uvAt(r, theta) });
      const off = a.sample({ time: 0, uv: uvAt(r + 0.6, theta) });
      expect(lum(on)).toBeGreaterThan(lum(off) + 0.02);
    }
  });

  it('animates: a point on the t = 0 curve is bright then changes', () => {
    const a = app();
    const theta = 0.4;
    const r = B + A_BASE * Math.cos(theta);
    const uv = uvAt(r, theta);

    const at0 = a.sample({ time: 0, uv });
    const at1 = a.sample({ time: 1.5, uv });
    expect(lum(at0)).toBeGreaterThan(0.1);
    expect(at0).not.toEqual(at1);
  });
});
