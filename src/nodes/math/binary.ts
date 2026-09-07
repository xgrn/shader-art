import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value, Wider } from '../../types';
import type { InGroup, OutGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { wider } from '../../math/glsl';
import { componentwise } from '../../math/runtime';

/** Base for `a op b` — scalar broadcasts, `vecN op vecM` (N≠M) rejected. */
export abstract class WideningBinary<A extends GLType, B extends GLType> extends Node {
  protected abstract readonly glsl: (a: string, b: string) => string;
  protected abstract readonly cpu: (x: number, y: number) => number;

  readonly in: InGroup<{ a: A; b: B }>;
  readonly out: OutGroup<{ value: Wider<A, B> }>;

  constructor(a?: Src<A>, b?: Src<B>) {
    super();
    const ta = (a !== undefined ? srcType(a) : 'float') as A;
    const tb = (b !== undefined ? srcType(b) : 'float') as B;
    this.in = this.declareIn({ a: ta, b: tb });
    this.out = this.declareOut({ value: wider(ta, tb) as Wider<A, B> });
    if (a !== undefined) this.in.a.connect(a);
    if (b !== undefined) this.in.b.connect(b);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        this.out.value.type,
        this.glsl(ctx.resolve(this.in.a), ctx.resolve(this.in.b)),
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return { value: componentwise(inputs.a as Value, inputs.b as Value, this.cpu) };
  }
}

export const binarySpec = (kind: string) =>
  ({ kind, inputs: { a: 'float', b: 'float' }, outputs: { value: 'float' } }) as const;
