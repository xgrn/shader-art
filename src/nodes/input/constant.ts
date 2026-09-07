import type { Value } from '../../types';
import { Node } from '../../graph/node';
import { SourceOutputPort } from '../../graph/ports';
import { glslLiteral, inferType } from '../../math/glsl';

/** The GLType implied by a literal value shape. */
export type TypeOfValue<V extends Value> = V extends number
  ? 'float'
  : V extends readonly [number, number]
    ? 'vec2'
    : V extends readonly [number, number, number]
      ? 'vec3'
      : 'vec4';

/** A compile-time constant. GLType is inferred from the value's shape. */
export class Constant<const V extends Value = number> extends Node {
  static readonly spec = {
    kind: 'const',
    inputs: {},
    outputs: { value: 'float' },
  } as const;

  readonly kind = 'const';
  readonly in: Readonly<Record<string, never>> = Object.freeze({});
  readonly out: { readonly value: SourceOutputPort<TypeOfValue<V>> };

  constructor(value: V, type?: TypeOfValue<V>) {
    super();
    const resolvedType = (type ?? inferType(value)) as TypeOfValue<V>;
    this.out = Object.freeze({
      value: new SourceOutputPort<TypeOfValue<V>>(this, 'value', resolvedType, value),
    });
  }

  emit(): Record<string, string> {
    return { value: glslLiteral(this.out.value.current, this.out.value.type) };
  }

  compute(): Record<string, Value> {
    return { value: this.out.value.current };
  }
}
