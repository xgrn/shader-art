import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import { SourceOutputPort } from '../../graph/ports';

let uniformCount = 0;

/**
 * An externally-driven `uniform float`. Wire `out.value` into the graph;
 * push new values each frame with `out.value.set(x)` (e.g. from `App`'s
 * `frame` event). Also settable for CPU `sample()` / tests.
 */
export class UniformNode extends Node {
  static readonly spec = {
    kind: 'uniform',
    inputs: {},
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'uniform';
  /** GLSL identifier this uniform is declared as. */
  readonly uniformName: string;
  readonly in: Readonly<Record<string, never>> = Object.freeze({});
  readonly out: { readonly value: SourceOutputPort<'float'> };

  constructor(name?: string, initial = 0) {
    super();
    this.uniformName = name ?? `u_${++uniformCount}`;
    this.out = Object.freeze({
      value: new SourceOutputPort<'float'>(this, 'value', 'float', initial),
    });
  }

  emit(ctx: CompileContext): Record<string, string> {
    ctx.addUniform({
      name: this.uniformName,
      type: 'float',
      value: this.out.value.current,
    });
    return { value: this.uniformName };
  }

  compute(): Record<string, Value> {
    return { value: this.out.value.current };
  }
}
