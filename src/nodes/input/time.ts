import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import { SourceOutputPort } from '../../graph/ports';

/** Elapsed time in seconds. Emits `uTime`; settable on the CPU for tests. */
export class TimeNode extends Node {
  static readonly spec = {
    kind: 'time',
    inputs: {},
    outputs: { t: 'float' },
  } as const;

  readonly kind = 'time';
  readonly in: Readonly<Record<string, never>> = Object.freeze({});
  readonly out: { readonly t: SourceOutputPort<'float'> } = Object.freeze({
    t: new SourceOutputPort<'float'>(this, 't', 'float', 0),
  });

  emit(ctx: CompileContext): Record<string, string> {
    ctx.useBuiltin('uTime');
    return { t: 'uTime' };
  }

  compute(): Record<string, Value> {
    return { t: this.out.t.current };
  }
}
