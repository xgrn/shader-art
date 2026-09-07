import type { CompileContext } from '../render/compile-context';
import type { Value } from '../types';
import { Node } from '../graph/node';
import type { Src } from '../graph/ports';
import { Constant } from './input';

export interface RendererInputs {
  r?: Src<'float'>;
  g?: Src<'float'>;
  b?: Src<'float'>;
  a?: Src<'float'>;
}

/**
 * Graph terminal. Its RGBA inputs become `gl_FragColor`; `out.color` mirrors
 * the result so tests can probe the final pixel on the CPU. `a` defaults opaque.
 */
export class RendererNode extends Node {
  static readonly spec = {
    kind: 'renderer',
    inputs: { r: 'float', g: 'float', b: 'float', a: 'float' },
    outputs: { color: 'vec4' },
  } as const;

  readonly kind = 'renderer';
  readonly in = this.declareIn({ r: 'float', g: 'float', b: 'float', a: 'float' });
  readonly out = this.declareOut({ color: 'vec4' });

  constructor(inputs: RendererInputs = {}) {
    super();
    this.in.a.connect(inputs.a ?? new Constant(1));
    if (inputs.r !== undefined) this.in.r.connect(inputs.r);
    if (inputs.g !== undefined) this.in.g.connect(inputs.g);
    if (inputs.b !== undefined) this.in.b.connect(inputs.b);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const r = ctx.resolve(this.in.r);
    const g = ctx.resolve(this.in.g);
    const b = ctx.resolve(this.in.b);
    const a = ctx.resolve(this.in.a);
    return { color: `vec4(${r}, ${g}, ${b}, ${a})` };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    return {
      color: [
        inputs.r as number,
        inputs.g as number,
        inputs.b as number,
        inputs.a as number,
      ],
    };
  }
}
