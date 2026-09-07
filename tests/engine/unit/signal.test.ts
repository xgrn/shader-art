import { App, Constant, RendererNode, SignalNode, compile } from '../../../src';

describe('SignalNode', () => {
  it('samples with linear interpolation on the CPU', () => {
    const sig = new SignalNode(4, 'wav');
    sig.set([0, 1, 0, -1]);
    const s = sig.sample(new Constant(0));

    expect(s.compute({ x: 0 }).value).toBe(0);
    expect(s.compute({ x: 1 / 6 }).value).toBeCloseTo(0.5); // between wav[0] and wav[1]
    expect(s.compute({ x: 1 / 3 }).value).toBeCloseTo(1); // exactly wav[1]
    expect(s.compute({ x: 1 }).value).toBe(-1);
  });

  it('clamps out-of-range x', () => {
    const sig = new SignalNode(4, 'wav');
    sig.set([2, 0, 0, 9]);
    const s = sig.sample(new Constant(0));
    expect(s.compute({ x: -5 }).value).toBe(2);
    expect(s.compute({ x: 5 }).value).toBe(9);
  });

  it('compiles to an array uniform + sampler helper', () => {
    const sig = new SignalNode(8, 'wav');
    const renderer = new RendererNode({
      r: sig.sample(new Constant(0.5)),
      g: new Constant(0),
      b: new Constant(0),
    });
    const { fragmentShader, uniforms } = compile(renderer);

    expect(fragmentShader).toContain('uniform float wav[8];');
    expect(fragmentShader).toContain('float wav_at(float x)');
    expect(fragmentShader).toContain('wav_at(0.5)');
    expect(uniforms.wav!.value).toBeInstanceOf(Float32Array);
  });

  it('drives the CPU sample and reacts to set()', () => {
    const sig = new SignalNode(4, 'wav');
    const renderer = new RendererNode({
      r: sig.sample(new Constant(0)),
      g: new Constant(0),
      b: new Constant(0),
    });
    const a = new App(renderer, { width: 2, height: 2 });

    expect(a.sample()[0]).toBe(0);
    sig.set([0.8, 0, 0, 0]);
    expect(a.sample()[0]).toBeCloseTo(0.8);
  });
});
