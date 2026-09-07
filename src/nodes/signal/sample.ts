import type { CompileContext } from '../../render/compile-context';
import type { Value } from '../../types';
import { Node } from '../../graph/node';
import type { Src } from '../../graph/ports';
import type { SignalNode } from './signal';

/** Reads a `SignalNode` at a float input. Created via `signal.sample(x)`. */
export class SampleNode extends Node {
  static readonly spec = {
    kind: 'sample',
    inputs: { x: 'float' },
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'sample';
  readonly in = this.declareIn({ x: 'float' });
  readonly out = this.declareOut({ value: 'float' });

  constructor(
    readonly signal: SignalNode,
    x?: Src<'float'>,
  ) {
    super();
    if (x !== undefined) this.in.x.connect(x);
  }

  emit(ctx: CompileContext): Record<string, string> {
    const { uniformName, size, buffer } = this.signal;
    ctx.addUniform({ name: uniformName, type: 'float', arraySize: size, value: buffer });
    ctx.addHelper(`${uniformName}_at`, buildSampler(uniformName, size));
    return { value: `${uniformName}_at(${ctx.resolve(this.in.x)})` };
  }

  compute(inputs: Record<string, Value>): Record<string, Value> {
    const { buffer, size } = this.signal;
    const pos = Math.min(1, Math.max(0, inputs.x as number)) * (size - 1);
    const i = Math.floor(pos);
    const a = buffer[i] ?? 0;
    const b = buffer[Math.min(i + 1, size - 1)] ?? 0;
    return { value: a + (b - a) * (pos - i) };
  }
}

/** Unrolled tent-basis lookup — linear interpolation with only constant indices. */
function buildSampler(name: string, n: number): string {
  const terms = Array.from(
    { length: n },
    (_, i) => `  s += ${name}[${i}] * max(0.0, 1.0 - abs(idx - ${i}.0));`,
  ).join('\n');
  return `float ${name}_at(float x) {
  float idx = clamp(x, 0.0, 1.0) * ${n - 1}.0;
  float s = 0.0;
${terms}
  return s;
}`;
}
