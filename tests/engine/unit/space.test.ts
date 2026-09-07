import { CartesianNode, PolarNode } from '../../../src';

describe('PolarNode / CartesianNode', () => {
  it('PolarNode splits a vec2 into radius + angle', () => {
    const r = new PolarNode().compute({ p: [3, 4] });
    expect(r.radius).toBe(5);
    expect(r.angle).toBeCloseTo(Math.atan2(4, 3));
  });

  it('CartesianNode is the inverse', () => {
    const polar = new PolarNode().compute({ p: [1, -2] });
    const back = new CartesianNode().compute({
      radius: polar.radius as number,
      angle: polar.angle as number,
    });
    const [x, y] = back.value as [number, number];
    expect(x).toBeCloseTo(1);
    expect(y).toBeCloseTo(-2);
  });
});
