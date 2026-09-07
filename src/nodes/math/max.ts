import type { GLType } from '../../types';
import { WideningBinary, binarySpec } from './binary';

export class MaxNode<
  A extends GLType = 'float',
  B extends GLType = 'float',
> extends WideningBinary<A, B> {
  static readonly spec = binarySpec('max');
  readonly kind = 'max';
  protected readonly glsl = (a: string, b: string) => `max(${a}, ${b})`;
  protected readonly cpu = Math.max;
}
