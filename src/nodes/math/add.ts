import type { GLType } from '../../types';
import { WideningBinary, binarySpec } from './binary';

export class AddNode<
  A extends GLType = 'float',
  B extends GLType = 'float',
> extends WideningBinary<A, B> {
  static readonly spec = binarySpec('add');
  readonly kind = 'add';
  protected readonly glsl = (a: string, b: string) => `(${a} + ${b})`;
  protected readonly cpu = (x: number, y: number) => x + y;
}
