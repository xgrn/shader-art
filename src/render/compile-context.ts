import type { Node } from '../graph/node';
import type { GLType, UniformSpec } from '../types';
import { InputPort, OutputPort, SwizzlePort } from '../graph/ports';
import { INCLUDES } from '../math/includes';

export type BuiltinUniform = 'uTime' | 'uResolution' | 'uMouse';

/** Accumulates GLSL as a single memoised backward walk from the renderer. */
export class CompileContext {
  private readonly emitted = new Map<Node, Record<string, string>>();
  private readonly includeNames = new Set<string>();
  private readonly helpers = new Map<string, string>();

  readonly lines: string[] = [];
  readonly uniforms = new Map<string, UniformSpec>();
  readonly builtins = new Set<BuiltinUniform>();

  /** GLSL expression for a port. `emit()` runs once per node. */
  resolve(port: InputPort | OutputPort): string {
    if (port instanceof InputPort) {
      return this.resolve(port.resolved());
    }
    if (port instanceof SwizzlePort) {
      const base = this.resolve(port.base);
      return port.base.type === 'float' ? base : `${base}.${port.pattern}`;
    }
    const node = port.node;
    let record = this.emitted.get(node);
    if (!record) {
      record = node.emit(this);
      this.emitted.set(node, record);
    }
    const expr = record[port.name];
    if (expr === undefined) {
      throw new Error(`${node.kind}.emit() did not produce output '${port.name}'`);
    }
    return expr;
  }

  /** Append `T nK = expr;` and return the temp var name. */
  hoist(type: GLType, expr: string): string {
    const name = `n${this.lines.length}`;
    this.lines.push(`  ${type} ${name} = ${expr};`);
    return name;
  }

  require(...names: string[]): void {
    for (const name of names) this.addInclude(name);
  }

  private addInclude(name: string): void {
    if (this.includeNames.has(name)) return;
    const include = INCLUDES[name];
    if (!include) throw new Error(`unknown include '${name}'`);
    for (const dep of include.deps) this.addInclude(dep);
    this.includeNames.add(name);
  }

  get includeSource(): string {
    return [...this.includeNames].map((name) => INCLUDES[name]!.code).join('\n\n');
  }

  /** Register a generated GLSL function (deduped by name). Emitted after includes. */
  addHelper(name: string, code: string): void {
    if (!this.helpers.has(name)) this.helpers.set(name, code);
  }

  get helperSource(): string {
    return [...this.helpers.values()].join('\n\n');
  }

  useBuiltin(name: BuiltinUniform): void {
    this.builtins.add(name);
  }

  addUniform(spec: UniformSpec): void {
    this.uniforms.set(spec.name, spec);
  }
}
