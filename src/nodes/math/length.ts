import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';

/** `length(v)` — Euclidean magnitude, `vecN → float`. */
export class LengthNode<T extends GLType = 'vec2'> extends Node {
  static readonly spec = {
    kind: 'length',
    inputs: { v: 'vec2' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'length';
  readonly in: InGroup<{ v: T }>;
  readonly out = this.declareOut({ value: 'float' });

  constructor(v?: Src<T>) {
    super();
    const t = (v !== undefined ? srcType(v) : 'vec2') as T;
    this.in = this.declareIn({ v: t });
    if (v !== undefined) this.in.v.connect(v);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return { value: ctx.hoist('float', `length(${ctx.resolve(this.in.v)})`) };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const v = inputs.v as Value;
    return { value: typeof v === 'number' ? Math.abs(v) : Math.hypot(...v) };
  }
}
