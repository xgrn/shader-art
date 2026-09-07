import type { Node } from './node';

/**
 * All nodes reachable backwards from `root` through connected input ports,
 * in dependency order (sources first, `root` last). Deduplicated by identity.
 */
export function collectNodes(root: Node): Node[] {
  const seen = new Set<Node>();
  const order: Node[] = [];

  const visit = (node: Node): void => {
    if (seen.has(node)) return;
    seen.add(node);
    for (const input of Object.values(node.in)) {
      const source = input.source;
      if (source) visit(source.node);
    }
    order.push(node);
  };

  visit(root);
  return order;
}
