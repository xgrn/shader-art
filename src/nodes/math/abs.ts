import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class AbsNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('abs');
  readonly kind = 'abs';
  protected readonly fn = 'abs';
  protected readonly cpu = Math.abs;
}
