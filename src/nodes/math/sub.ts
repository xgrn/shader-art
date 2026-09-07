import type { GLType } from '../../types';
import { WideningBinary, binarySpec } from './binary';

export class SubNode<
  A extends GLType = 'float',
  B extends GLType = 'float',
> extends WideningBinary<A, B> {
  static readonly spec = binarySpec('sub');
  readonly kind = 'sub';
  protected readonly glsl = (a: string, b: string) => `(${a} - ${b})`;
  protected readonly cpu = (x: number, y: number) => x - y;
}
