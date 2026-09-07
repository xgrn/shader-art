import type { GLType } from '../../types';
import { WideningBinary, binarySpec } from './binary';

export class ModNode<
  A extends GLType = 'float',
  B extends GLType = 'float',
> extends WideningBinary<A, B> {
  static readonly spec = binarySpec('mod');
  readonly kind = 'mod';
  protected readonly glsl = (a: string, b: string) => `mod(${a}, ${b})`;
  // GLSL mod is floored division, unlike JS `%`.
  protected readonly cpu = (x: number, y: number) => x - y * Math.floor(x / y);
}
