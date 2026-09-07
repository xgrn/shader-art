import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup, OutGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { mapComponents } from '../../math/runtime';

/** Base for `f(x)` — componentwise, type-preserving. */
export abstract class UnaryFn<T extends GLType> extends Node {
  protected abstract readonly fn: string;
  protected abstract readonly cpu: (x: number) => number;

  readonly in: InGroup<{ x: T }>;
  readonly out: OutGroup<{ value: T }>;

  constructor(x?: Src<T>) {
    super();
    const t = (x !== undefined ? srcType(x) : 'float') as T;
    this.in = this.declareIn({ x: t });
    this.out = this.declareOut({ value: t });
    if (x !== undefined) this.in.x.connect(x);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(this.out.value.type, `${this.fn}(${ctx.resolve(this.in.x)})`),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return { value: mapComponents(inputs.x as Value, this.cpu) };
  }
}

export const unarySpec = (kind: string) =>
  ({ kind, inputs: { x: 'float' }, outputs: { value: 'float' } }) as const;
