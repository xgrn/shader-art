import type { Value } from '../../types';
import { Node } from '../../graph/node';
import { SourceOutputPort } from '../../graph/ports';

/** Per-pixel coordinate — `vUv`, normalised 0..1 across the viewport. */
export class UVNode extends Node {
  static readonly spec = {
    kind: 'uv',
    inputs: {},
    outputs: { uv: 'vec2' },
  } as const;

  readonly kind = 'uv';
  readonly in: Readonly<Record<string, never>> = Object.freeze({});
  readonly out: { readonly uv: SourceOutputPort<'vec2'> } = Object.freeze({
    uv: new SourceOutputPort<'vec2'>(this, 'uv', 'vec2', [0, 0]),
  });

  emit(): Record<string, string> {
    return { uv: 'vUv' };
  }

  compute(): Record<string, Value> {
    return { uv: this.out.uv.current };
  }
}
