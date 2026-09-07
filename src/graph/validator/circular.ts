import type { Node } from '../node';
import type { GraphProblem } from './types';

interface Frame {
  readonly node: Node;
  /** Input port currently being recursed through — the edge to the next frame. */
  via?: string;
}

/** Reports one problem per cycle reachable backward from `root`, with its path. */
export function circular(root: Node): GraphProblem[] {
  const problems: GraphProblem[] = [];
  const state = new Map<Node, 'visiting' | 'done'>();
  const stack: Frame[] = [];

  const visit = (node: Node): void => {
    const seen = state.get(node);
    if (seen === 'done') return;
    if (seen === 'visiting') {
      const start = stack.findIndex((f) => f.node === node);
      if (start !== -1) {
        problems.push({ type: 'cycle', message: `cycle: ${formatCycle(stack.slice(start))}` });
      }
      return;
    }

    state.set(node, 'visiting');
    const frame: Frame = { node };
    stack.push(frame);
    for (const [name, input] of Object.entries(node.in)) {
      const source = input.source;
      if (source) {
        frame.via = name;
        visit(source.node);
      }
    }
    stack.pop();
    state.set(node, 'done');
  };

  visit(root);
  return problems;
}

/** `sin#1.x → add#2.b → sin#1` — each `kind#n.port` is the input the edge enters. */
function formatCycle(loop: Frame[]): string {
  const ids = new Map<Node, number>();
  const label = (node: Node): string => {
    let id = ids.get(node);
    if (id === undefined) {
      id = ids.size + 1;
      ids.set(node, id);
    }
    return `${node.kind}#${id}`;
  };

  const hops = loop.map((f) => `${label(f.node)}.${f.via ?? '?'}`);
  return `${hops.join(' → ')} → ${label(loop[0]!.node)}`;
}
