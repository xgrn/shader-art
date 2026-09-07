import type { GLType, Value } from '../types';

export function glslFloat(n: number): string {
  if (!Number.isFinite(n)) throw new Error(`cannot emit non-finite float: ${n}`);
  return Number.isInteger(n) ? `${n}.0` : String(n);
}

export function glslLiteral(value: Value, type: GLType): string {
  if (type === 'float') return glslFloat(value as number);
  const components = value as readonly number[];
  return `${type}(${components.map(glslFloat).join(', ')})`;
}

/** Runtime companion of the `Wider` type. Throws on `vec2` + `vec3` etc. */
export function wider(a: GLType, b: GLType): GLType {
  if (a === b) return a;
  if (a === 'float') return b;
  if (b === 'float') return a;
  throw new TypeError(
    `no common GLType for ${a} and ${b} — use vecN op vecN (same size) or vecN op float`,
  );
}

export function inferType(value: Value): GLType {
  if (typeof value === 'number') return 'float';
  switch (value.length) {
    case 2:
      return 'vec2';
    case 3:
      return 'vec3';
    case 4:
      return 'vec4';
    default:
      throw new Error(`cannot infer GLType from ${JSON.stringify(value)}`);
  }
}
