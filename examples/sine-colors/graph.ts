import { AddNode, Constant, RendererNode, SinNode, TimeNode } from '../../src';

export const WIDTH = 640;
export const HEIGHT = 480;

const TAU = Math.PI * 2;

/** time ──▶ (+ phase) ──▶ sin ──▶ renderer, one sine per channel. */
export function sineColors(): { renderer: RendererNode } {
  const time = new TimeNode();
  const channel = (phase: number) =>
    new SinNode(new AddNode(time.out.t, new Constant(phase)));

  return {
    renderer: new RendererNode({
      r: channel(0),
      g: channel(TAU / 3),
      b: channel((2 * TAU) / 3),
    }),
  };
}
