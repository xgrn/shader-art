import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class CosNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('cos');
  readonly kind = 'cos';
  protected readonly fn = 'cos';
  protected readonly cpu = Math.cos;
}
