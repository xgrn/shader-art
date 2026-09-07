import { EscapeFractalNode } from '../../../examples/julia/escape-fractal';

describe('EscapeFractalNode', () => {
  const node = () => new EscapeFractalNode(undefined, undefined, { iterations: 60 });

  it('bounded orbits never escape', () => {
    expect(node().compute({ z: [0, 0], c: [0, 0] }).escape).toBe(1);
    expect(node().compute({ z: [0, 0], c: [-1, 0] }).escape).toBe(1); // period-2
  });

  it('divergent orbits escape fast', () => {
    expect(node().compute({ z: [0, 0], c: [2, 2] }).escape as number).toBeLessThan(0.1);
    expect(node().compute({ z: [3, 0], c: [0, 0] }).escape as number).toBeLessThan(0.1);
  });
});
