import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class AtanNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('atan');
  readonly kind = 'atan';
  protected readonly fn = 'atan';
  protected readonly cpu = Math.atan;
}
