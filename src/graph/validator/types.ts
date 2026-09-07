import type { Node } from '../node';

export interface GraphProblem {
  type: 'cycle' | 'unconnected-input';
  message: string;
}

/** A check that walks the graph backward from `root` and reports its problems. */
export type GraphCheck = (root: Node) => GraphProblem[];

/** Thrown by `assertValidGraph` (and therefore by `compile` / `new App`). */
export class GraphValidationError extends Error {
  constructor(readonly problems: GraphProblem[]) {
    super(
      `invalid shader graph:\n` +
        problems.map((p) => `  • ${p.message}`).join('\n'),
    );
    this.name = 'GraphValidationError';
  }
}
