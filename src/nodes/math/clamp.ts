import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup, OutGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { combine3 } from '../../math/runtime';

/** `clamp(x, lo, hi)`, componentwise. */
export class ClampNode<T extends GLType = 'float'> extends Node {
  static readonly spec = {
    kind: 'clamp',
    inputs: { x: 'float', lo: 'float', hi: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'clamp';
  readonly in: InGroup<{ x: T; lo: T; hi: T }>;
  readonly out: OutGroup<{ value: T }>;

  constructor(x?: Src<T>, lo?: Src<T>, hi?: Src<T>) {
    super();
    const first = x ?? lo ?? hi;
    const t = (first !== undefined ? srcType(first) : 'float') as T;
    this.in = this.declareIn({ x: t, lo: t, hi: t });
    this.out = this.declareOut({ value: t });
    if (x !== undefined) this.in.x.connect(x);
    if (lo !== undefined) this.in.lo.connect(lo);
    if (hi !== undefined) this.in.hi.connect(hi);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        this.out.value.type,
        `clamp(${ctx.resolve(this.in.x)}, ${ctx.resolve(this.in.lo)}, ${ctx.resolve(this.in.hi)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return {
      value: combine3(
        inputs.x as Value,
        inputs.lo as Value,
        inputs.hi as Value,
        (x, lo, hi) => Math.min(hi, Math.max(lo, x)),
      ),
    };
  }
}
