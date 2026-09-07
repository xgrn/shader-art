import {
  AddNode,
  Constant,
  GraphValidationError,
  RendererNode,
  SinNode,
  compile,
  validateGraph,
} from '../../../src';

describe('validateGraph', () => {
  it('passes a well-formed graph', () => {
    const renderer = new RendererNode({
      r: new SinNode(new Constant(0)),
      g: new Constant(0),
      b: new Constant(0),
    });
    expect(validateGraph(renderer)).toEqual([]);
  });

  it('reports every unconnected input', () => {
    const renderer = new RendererNode({ r: new Constant(0) }); // g, b dangling
    const problems = validateGraph(renderer);
    expect(problems.map((p) => p.message).sort()).toEqual([
      'renderer.b is not connected',
      'renderer.g is not connected',
    ]);
    expect(problems.every((p) => p.type === 'unconnected-input')).toBe(true);
  });

  it('detects a cycle and prints the path back to the start', () => {
    const add = new AddNode(new Constant(1));
    const sin = new SinNode(add);
    add.in.b.connect(sin); // add ← sin ← add
    const renderer = new RendererNode({ r: sin, g: new Constant(0), b: new Constant(0) });

    const [cycle, ...rest] = validateGraph(renderer);
    expect(rest).toEqual([]);
    expect(cycle!.type).toBe('cycle');
    expect(cycle!.message).toBe('cycle: sin#1.x → add#2.b → sin#1');
  });

  it('compile() throws GraphValidationError instead of overflowing the stack', () => {
    const add = new AddNode(new Constant(1));
    add.in.b.connect(new SinNode(add));
    const renderer = new RendererNode({ r: add, g: new Constant(0), b: new Constant(0) });

    expect(() => compile(renderer)).toThrow(GraphValidationError);
    expect(() => compile(renderer)).toThrow(/cycle: /);
  });
});
