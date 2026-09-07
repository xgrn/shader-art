import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class SqrtNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('sqrt');
  readonly kind = 'sqrt';
  protected readonly fn = 'sqrt';
  protected readonly cpu = Math.sqrt;
}
