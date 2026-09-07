import { App, Constant, RendererNode } from '../../../src';

const build = () =>
  new RendererNode({ r: new Constant(0), g: new Constant(0), b: new Constant(0) });

describe('App lifecycle', () => {
  it('stop() before run() is a no-op', () => {
    const app = new App(build(), { width: 2, height: 2 });
    expect(() => app.stop()).not.toThrow();
    expect(app.isRunning).toBe(false);
  });

  it('destroy() is idempotent', () => {
    const app = new App(build(), { width: 2, height: 2 });
    app.destroy();
    expect(() => app.destroy()).not.toThrow();
  });

  it('run() after destroy() throws', () => {
    const app = new App(build(), { width: 2, height: 2 });
    app.destroy();
    expect(() => app.run()).toThrow(/destroy/i);
  });

  it('setAttribution stores without a DOM and never throws', () => {
    const app = new App(build(), { width: 2, height: 2 });
    expect(() => app.setAttribution({ x: 'right', y: 'bottom', text: 'John Doe' })).not.toThrow();
    expect(() => app.setAttribution(null)).not.toThrow();
  });

  it('sample() still works after destroy()', () => {
    const app = new App(build(), { width: 2, height: 2 });
    app.destroy();
    expect(app.sample()).toEqual([0, 0, 0, 1]);
  });
});
