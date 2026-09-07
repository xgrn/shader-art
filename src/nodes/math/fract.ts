import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class FractNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('fract');
  readonly kind = 'fract';
  protected readonly fn = 'fract';
  protected readonly cpu = (x: number) => x - Math.floor(x);
}
