import type { GLType } from '../../types';
import { WideningBinary, binarySpec } from './binary';

export class MinNode<
  A extends GLType = 'float',
  B extends GLType = 'float',
> extends WideningBinary<A, B> {
  static readonly spec = binarySpec('min');
  readonly kind = 'min';
  protected readonly glsl = (a: string, b: string) => `min(${a}, ${b})`;
  protected readonly cpu = Math.min;
}
