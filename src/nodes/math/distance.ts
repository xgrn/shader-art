import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { componentwise } from '../../math/runtime';

/** `distance(a, b)` = `length(a − b)`, `vecN → float`. */
export class DistanceNode<T extends GLType = 'vec2'> extends Node {
  static readonly spec = {
    kind: 'distance',
    inputs: { a: 'vec2', b: 'vec2' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'distance';
  readonly in: InGroup<{ a: T; b: T }>;
  readonly out = this.declareOut({ value: 'float' });

  constructor(a?: Src<T>, b?: Src<T>) {
    super();
    const t = (a !== undefined
      ? srcType(a)
      : b !== undefined
        ? srcType(b)
        : 'vec2') as T;
    this.in = this.declareIn({ a: t, b: t });
    if (a !== undefined) this.in.a.connect(a);
    if (b !== undefined) this.in.b.connect(b);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        'float',
        `distance(${ctx.resolve(this.in.a)}, ${ctx.resolve(this.in.b)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const diff = componentwise(
      inputs.a as Value,
      inputs.b as Value,
      (x, y) => x - y,
    );
    return {
      value: typeof diff === 'number' ? Math.abs(diff) : Math.hypot(...diff),
    };
  }
}
