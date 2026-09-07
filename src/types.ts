export type GLType = 'float' | 'vec2' | 'vec3' | 'vec4';

export type Value =
  | number
  | readonly [number, number]
  | readonly [number, number, number]
  | readonly [number, number, number, number];

/** Number of components in a GLType. */
export const COMPONENTS: Record<GLType, number> = {
  float: 1,
  vec2: 2,
  vec3: 3,
  vec4: 4,
};

/**
 * Result GLType of a componentwise binary op: the wider operand. A scalar
 * broadcasts against a vector; mixing two different vector sizes is `never`
 * (GLSL rejects it too).
 */
export type Wider<A extends GLType, B extends GLType> = {
  float: { float: 'float'; vec2: 'vec2'; vec3: 'vec3'; vec4: 'vec4' };
  vec2: { float: 'vec2'; vec2: 'vec2'; vec3: never; vec4: never };
  vec3: { float: 'vec3'; vec2: never; vec3: 'vec3'; vec4: never };
  vec4: { float: 'vec4'; vec2: never; vec3: never; vec4: 'vec4' };
}[A][B];

export interface NodeSpec {
  kind: string;
  inputs: Record<string, GLType>;
  outputs: Record<string, GLType>;
}

export interface UniformSpec {
  name: string;
  type: GLType;
  /** Whatever Three needs for this uniform (number, tuple, Float32Array, …). */
  value: unknown;
  /** Set for `uniform T name[arraySize];`. */
  arraySize?: number;
}

export interface CompiledShader {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}
