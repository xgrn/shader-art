import type { GLType } from '../../types';
import { UnaryFn, unarySpec } from './unary';

export class FloorNode<T extends GLType = 'float'> extends UnaryFn<T> {
  static readonly spec = unarySpec('floor');
  readonly kind = 'floor';
  protected readonly fn = 'floor';
  protected readonly cpu = Math.floor;
}
