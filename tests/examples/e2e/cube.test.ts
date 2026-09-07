import { App } from '../../../src';
import { HEIGHT, WIDTH, cube } from '../../../examples/cube/graph';

const lum = (c: readonly number[]) => (c[0]! + c[1]! + c[2]!) / 3;

describe('cube example', () => {
  it('compiles the 3D pipeline', () => {
    const { fragmentShader } = new App(cube().renderer, {
      width: WIDTH,
      height: HEIGHT,
    }).shader;
    expect(fragmentShader).toContain('vec3 sa_rot_x(vec3 v, float a)');
    expect(fragmentShader).toContain('vec3 sa_rot_y(vec3 v, float a)');
    expect(fragmentShader).toContain('vec3 sa_rot_z(vec3 v, float a)');
    expect(fragmentShader).toContain('sa_bary(');
    expect(fragmentShader).toContain('uniform float uTime;');
    expect(fragmentShader).toContain('uniform vec2 uResolution;');
  });

  it('the centre pixel is on the cube; a corner pixel is background', () => {
    const app = new App(cube().renderer, { width: 64, height: 64 });
    const centre = app.sample({ time: 0.4, uv: [0.5, 0.5] });
    const corner = app.sample({ time: 0.4, uv: [0.02, 0.02] });
    expect(lum(centre)).toBeGreaterThan(0.15); // a lit face
    expect(lum(corner)).toBeLessThan(0.1); // background
  });

  it('animates', () => {
    const app = new App(cube().renderer, { width: 16, height: 16 });
    const grid = (time: number) => {
      const cells: string[] = [];
      for (let y = 0; y < 6; y++) {
        for (let x = 0; x < 6; x++) {
          cells.push(app.sample({ time, uv: [(x + 0.5) / 6, (y + 0.5) / 6] }).join(','));
        }
      }
      return cells;
    };
    expect(grid(0)).not.toEqual(grid(3));
  });
});
