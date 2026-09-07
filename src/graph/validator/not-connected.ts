import type { Node } from '../node';
import { collectNodes } from '../collect';
import type { GraphProblem } from './types';

/** Reports every input port left unconnected on a node reachable from `root`. */
export function notConnected(root: Node): GraphProblem[] {
  const problems: GraphProblem[] = [];
  for (const node of collectNodes(root)) {
    for (const [name, input] of Object.entries(node.in)) {
      if (!input.source) {
        problems.push({
          type: 'unconnected-input',
          message: `${node.kind}.${name} is not connected`,
        });
      }
    }
  }
  return problems;
}
