import type { Node } from './node';
import type { GLType, Value } from '../types';
import { COMPONENTS } from '../types';
import { currentEpoch, bumpEpoch } from './epoch';

export type ValueOf<T extends GLType> = T extends 'float'
  ? number
  : T extends 'vec2'
    ? readonly [number, number]
    : T extends 'vec3'
      ? readonly [number, number, number]
      : readonly [number, number, number, number];

const SWIZZLE_INDEX: Record<string, number> = {
  x: 0, y: 1, z: 2, w: 3,
  r: 0, g: 1, b: 2, a: 3,
};

const RESULT_TYPE = ['float', 'vec2', 'vec3', 'vec4'] as const;

/** Pull cache: an output's last computed value and the epoch it was valid at. */
const outputCache = new WeakMap<OutputPort, { epoch: number; value: Value }>();
const resolving = new Set<OutputPort>();

export class OutputPort<T extends GLType = GLType> {
  private readonly swizzles = new Map<string, OutputPort>();

  constructor(
    readonly node: Node,
    readonly name: string,
    readonly type: T,
  ) {}

  /** Lazy CPU value — pulls through the graph, cached per epoch. */
  get value(): Value {
    return pull(this);
  }

  swizzle(pattern: string): OutputPort {
    if (this.type === 'float') {
      if (pattern !== 'x' && pattern !== 'r') {
        throw new Error(`.${pattern} is not available on float`);
      }
      return this;
    }
    const cached = this.swizzles.get(pattern);
    if (cached) return cached;

    const max = COMPONENTS[this.type];
    for (const ch of pattern) {
      const index = SWIZZLE_INDEX[ch];
      if (index === undefined) throw new Error(`invalid swizzle component '${ch}'`);
      if (index >= max) throw new Error(`.${ch} is not available on ${this.type}`);
    }
    const resultType = RESULT_TYPE[pattern.length - 1];
    if (!resultType) throw new Error(`invalid swizzle '.${pattern}'`);

    const port = new SwizzlePort(this, pattern, resultType);
    this.swizzles.set(pattern, port);
    return port;
  }

  get x(): OutputPort<'float'> {
    return this.swizzle('x') as OutputPort<'float'>;
  }
  get y(): OutputPort<'float'> {
    return this.swizzle('y') as OutputPort<'float'>;
  }
  get z(): OutputPort<'float'> {
    return this.swizzle('z') as OutputPort<'float'>;
  }
  get w(): OutputPort<'float'> {
    return this.swizzle('w') as OutputPort<'float'>;
  }
  get xy(): OutputPort<'vec2'> {
    return this.swizzle('xy') as OutputPort<'vec2'>;
  }
  get xyz(): OutputPort<'vec3'> {
    return this.swizzle('xyz') as OutputPort<'vec3'>;
  }
  get rgb(): OutputPort<'vec3'> {
    return this.swizzle('rgb') as OutputPort<'vec3'>;
  }
}

export class SwizzlePort<T extends GLType = GLType> extends OutputPort<T> {
  constructor(
    readonly base: OutputPort,
    readonly pattern: string,
    type: T,
  ) {
    super(base.node, `${base.name}.${pattern}`, type);
  }

  override get value(): Value {
    const source = this.base.value;
    const arr: readonly number[] = typeof source === 'number' ? [source] : source;
    const picked = [...this.pattern].map((ch) => arr[SWIZZLE_INDEX[ch]!]!);
    return (picked.length === 1 ? picked[0]! : picked) as Value;
  }
}

export class SourceOutputPort<T extends GLType = GLType> extends OutputPort<T> {
  constructor(
    node: Node,
    name: string,
    type: T,
    public current: Value,
  ) {
    super(node, name, type);
  }

  override get value(): Value {
    return this.current;
  }

  setValue(value: ValueOf<T>): this {
    this.current = value as Value;
    bumpEpoch();
    return this;
  }

  /** Terser alias of `setValue`. */
  set(value: ValueOf<T>): this {
    return this.setValue(value);
  }
}

export type SingleOutputNode<T extends GLType> = {
  readonly kind: string;
  readonly out: { readonly value: OutputPort<T> };
};

export type Src<T extends GLType> = OutputPort<T> | SingleOutputNode<T>;

export function toOutputPort<T extends GLType>(src: Src<T>): OutputPort<T> {
  return src instanceof OutputPort ? src : src.out.value;
}

/** The GLType a source carries, without connecting it. */
export function srcType<T extends GLType>(src: Src<T>): T {
  return toOutputPort(src).type;
}

export class InputPort<T extends GLType = GLType> {
  private connected: OutputPort<T> | undefined;

  constructor(
    readonly node: Node,
    readonly name: string,
    readonly type: T,
  ) {}

  get source(): OutputPort<T> | undefined {
    return this.connected;
  }

  connect(src: Src<T>): this {
    const port = toOutputPort(src);
    if (port.type !== this.type) {
      throw new TypeError(
        `${this.node.kind}.${this.name}: cannot wire ` +
          `${port.node.kind}.${port.name} (${port.type}) into a ${this.type} input`,
      );
    }
    if (this.connected) {
      throw new Error(`${this.node.kind}.${this.name} is already connected`);
    }
    this.connected = port;
    return this;
  }

  from(src: Src<T>): this {
    return this.connect(src);
  }

  resolved(): OutputPort<T> {
    if (!this.connected) {
      throw new Error(`${this.node.kind}.${this.name} is not connected`);
    }
    return this.connected;
  }
}

export function connect<T extends GLType>(source: Src<T>, target: InputPort<T>): void {
  target.connect(source);
}

function pull(port: OutputPort): Value {
  const cached = outputCache.get(port);
  const epoch = currentEpoch();
  if (cached && cached.epoch === epoch) return cached.value;

  if (resolving.has(port)) {
    throw new Error(`cycle detected through ${port.node.kind}.${port.name}`);
  }
  resolving.add(port);
  try {
    const node = port.node;
    const inputs: Record<string, Value> = {};
    for (const [name, input] of Object.entries(node.in)) {
      inputs[name] = input.resolved().value;
    }
    const outputs = node.compute(inputs);
    for (const [name, out] of Object.entries(node.out)) {
      const value = outputs[name];
      if (value !== undefined) outputCache.set(out, { epoch, value });
    }
    const mine = outputs[port.name];
    if (mine === undefined) {
      throw new Error(`${node.kind}.compute() did not produce output '${port.name}'`);
    }
    return mine;
  } finally {
    resolving.delete(port);
  }
}
