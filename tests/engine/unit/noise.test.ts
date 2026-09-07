import { Constant, NoiseNode, RendererNode, Vec2Node, compile } from '../../../src';

const at = (n: NoiseNode, x: number, y: number) => n.compute({ p: [x, y] }).value as number;

describe('NoiseNode', () => {
  it('is deterministic and stays roughly in range', () => {
    const n = new NoiseNode(undefined, { octaves: 5 });
    expect(at(n, 1.5, 2.5)).toBe(at(n, 1.5, 2.5));
    for (let i = 0; i < 200; i++) {
      const v = at(n, i * 0.37, i * 1.13 + 0.2);
      expect(v).toBeGreaterThan(-1.1);
      expect(v).toBeLessThan(1.1);
    }
  });

  it('varies across space and is continuous', () => {
    const n = new NoiseNode(undefined, { octaves: 4 });
    expect(at(n, 0, 0)).not.toBe(at(n, 5.3, 7.1));
    expect(Math.abs(at(n, 3, 3) - at(n, 3.002, 3))).toBeLessThan(0.05);
  });

  it('compiles the value-noise + fBm helpers', () => {
    const p = new Vec2Node(new Constant(0), new Constant(0));
    const renderer = new RendererNode({
      r: new NoiseNode(p, { octaves: 5 }),
      g: new Constant(0),
      b: new Constant(0),
    });
    const { fragmentShader } = compile(renderer);
    expect(fragmentShader).toContain('float sa_hash21(vec2 p)');
    expect(fragmentShader).toContain('float sa_valueNoise(vec2 p)');
    expect(fragmentShader).toMatch(/for \(int i = 0; i < 5; i\+\+\)/);
  });
});
