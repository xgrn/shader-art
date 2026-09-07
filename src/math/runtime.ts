import type { Value } from '../types';

/** Apply `f` to every component (or to the scalar). */
export function mapComponents(value: Value, f: (x: number) => number): Value {
  return typeof value === 'number' ? f(value) : (value.map(f) as unknown as Value);
}

/** Combine two values componentwise; a scalar broadcasts against a vector. */
export function componentwise(
  a: Value,
  b: Value,
  op: (x: number, y: number) => number,
): Value {
  const av = typeof a === 'number' ? undefined : a;
  const bv = typeof b === 'number' ? undefined : b;
  if (av && bv) {
    if (av.length !== bv.length) {
      throw new Error(`componentwise: length ${av.length} vs ${bv.length}`);
    }
    return av.map((x, i) => op(x, bv[i]!)) as unknown as Value;
  }
  if (av) return av.map((x) => op(x, b as number)) as unknown as Value;
  if (bv) return bv.map((y) => op(a as number, y)) as unknown as Value;
  return op(a as number, b as number);
}

/** Combine three values componentwise; scalars broadcast against vectors. */
export function combine3(
  a: Value,
  b: Value,
  c: Value,
  op: (x: number, y: number, z: number) => number,
): Value {
  const len = Math.max(
    typeof a === 'number' ? 0 : a.length,
    typeof b === 'number' ? 0 : b.length,
    typeof c === 'number' ? 0 : c.length,
  );
  const at = (v: Value, i: number) => (typeof v === 'number' ? v : v[i]!);
  if (len === 0) return op(a as number, b as number, c as number);
  return Array.from({ length: len }, (_, i) =>
    op(at(a, i), at(b, i), at(c, i)),
  ) as unknown as Value;
}
