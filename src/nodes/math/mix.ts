import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup, OutGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { componentwise } from '../../math/runtime';

/** `mix(a, b, t)` = `a·(1−t) + b·t`. `a`/`b` are any type; `t` is float. */
export class MixNode<T extends GLType = 'float'> extends Node {
  static readonly spec = {
    kind: 'mix',
    inputs: { a: 'float', b: 'float', t: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'mix';
  readonly in: InGroup<{ a: T; b: T; t: 'float' }>;
  readonly out: OutGroup<{ value: T }>;

  constructor(a?: Src<T>, b?: Src<T>, t?: Src<'float'>) {
    super();
    const type = (a !== undefined
      ? srcType(a)
      : b !== undefined
        ? srcType(b)
        : 'float') as T;
    this.in = this.declareIn({ a: type, b: type, t: 'float' });
    this.out = this.declareOut({ value: type });
    if (a !== undefined) this.in.a.connect(a);
    if (b !== undefined) this.in.b.connect(b);
    if (t !== undefined) this.in.t.connect(t);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        this.out.value.type,
        `mix(${ctx.resolve(this.in.a)}, ${ctx.resolve(this.in.b)}, ${ctx.resolve(this.in.t)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const t = inputs.t as number;
    return {
      value: componentwise(
        inputs.a as Value,
        inputs.b as Value,
        (x, y) => x + (y - x) * t,
      ),
    };
  }
}
