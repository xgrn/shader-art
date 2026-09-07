import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import { SourceOutputPort } from '../../graph/ports';

/** Canvas size in CSS pixels — `uResolution`, fed by the `App` before `run()`. */
export class ViewportNode extends Node {
  static readonly spec = {
    kind: 'viewport',
    inputs: {},
    outputs: { size: 'vec2' },
  } as const;

  readonly kind = 'viewport';
  readonly in: Readonly<Record<string, never>> = Object.freeze({});
  readonly out: { readonly size: SourceOutputPort<'vec2'> } = Object.freeze({
    size: new SourceOutputPort<'vec2'>(this, 'size', 'vec2', [1, 1]),
  });

  emit(ctx: CompileContext): Record<string, string> {
    ctx.useBuiltin('uResolution');
    return { size: 'uResolution' };
  }

  compute(): Record<string, Value> {
    return { size: this.out.size.current };
  }
}
