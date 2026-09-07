import type { CompileContext } from '../../render/compile-context';
import type { GLType, Value } from '../../types';
import type { InGroup, OutGroup } from '../../graph/node';
import { Node } from '../../graph/node';
import { srcType, type Src } from '../../graph/ports';
import { componentwise } from '../../math/runtime';

/** `pow(base, exp)`. GLSL `pow` needs matching types — no scalar broadcast. */
export class PowNode<T extends GLType = 'float'> extends Node {
  static readonly spec = {
    kind: 'pow',
    inputs: { base: 'float', exp: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'pow';
  readonly in: InGroup<{ base: T; exp: T }>;
  readonly out: OutGroup<{ value: T }>;

  constructor(base?: Src<T>, exp?: Src<T>) {
    super();
    const t = (base !== undefined
      ? srcType(base)
      : exp !== undefined
        ? srcType(exp)
        : 'float') as T;
    this.in = this.declareIn({ base: t, exp: t });
    this.out = this.declareOut({ value: t });
    if (base !== undefined) this.in.base.connect(base);
    if (exp !== undefined) this.in.exp.connect(exp);
  }

  emit(ctx: CompileContext): Record<string, string> {
    return {
      value: ctx.hoist(
        this.out.value.type,
        `pow(${ctx.resolve(this.in.base)}, ${ctx.resolve(this.in.exp)})`,
      ),
    };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return {
      value: componentwise(inputs.base as Value, inputs.exp as Value, Math.pow),
    };
  }
}
