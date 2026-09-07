import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class SinNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('sin');
  readonly kind = 'sin';
  protected readonly fn = 'sin';
  protected readonly cpu = Math.sin;
}
