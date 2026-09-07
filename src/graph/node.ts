import type { GLType, Value } from '../types';
import type { CompileContext } from '../render/compile-context';
import { InputPort, OutputPort } from './ports';

export type InGroup<S extends Record<string, GLType>> = {
  readonly [K in keyof S]: InputPort<S[K]>;
};
export type OutGroup<S extends Record<string, GLType>> = {
  readonly [K in keyof S]: OutputPort<S[K]>;
};

/**
 * A node in a shader graph. Built-in library nodes and user-defined nodes
 * implement this exact contract — the library has no special privileges.
 */
export abstract class Node {
  /** GLType layout, for tooling / serialisation. */
  abstract readonly kind: string;

  /** Frozen port groups. `readonly` field + Object.freeze — cannot be replaced. */
  abstract readonly in: Readonly<Record<string, InputPort>>;
  abstract readonly out: Readonly<Record<string, OutputPort>>;

  protected declareIn<const S extends Record<string, GLType>>(spec: S): InGroup<S> {
    const group: Record<string, InputPort> = {};
    for (const [name, type] of Object.entries(spec)) {
      group[name] = new InputPort(this, name, type);
    }
    return Object.freeze(group) as InGroup<S>;
  }

  protected declareOut<const S extends Record<string, GLType>>(spec: S): OutGroup<S> {
    const group: Record<string, OutputPort> = {};
    for (const [name, type] of Object.entries(spec)) {
      group[name] = new OutputPort(this, name, type);
    }
    return Object.freeze(group) as OutGroup<S>;
  }

  /** GPU: one GLSL expression per output name. */
  abstract emit(ctx: CompileContext): Record<string, string>;

  /** CPU: pure. Resolved input values in, output values out. Mirrors `emit`. */
  abstract compute(inputs: Record<string, Value>): Record<string, Value>;
}
