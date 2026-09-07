import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class TanNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('tan');
  readonly kind = 'tan';
  protected readonly fn = 'tan';
  protected readonly cpu = Math.tan;
}
