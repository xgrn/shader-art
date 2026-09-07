import type { Node } from '../node';
import { circular } from './circular';
import { notConnected } from './not-connected';
import { GraphValidationError, type GraphCheck, type GraphProblem } from './types';

export { GraphValidationError };
export type { GraphProblem, GraphCheck };

const CHECKS: readonly GraphCheck[] = [circular, notConnected];

/** Every structural problem in the graph reachable backward from `root`. */
export function validateGraph(root: Node): GraphProblem[] {
  return CHECKS.flatMap((check) => check(root));
}

/** Throw `GraphValidationError` if `validateGraph` finds anything. */
export function assertValidGraph(root: Node): void {
  const problems = validateGraph(root);
  if (problems.length > 0) throw new GraphValidationError(problems);
}
