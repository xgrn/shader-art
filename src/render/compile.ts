import type { CompiledShader } from '../types';
import type { RendererNode } from '../nodes/renderer';
import { assertValidGraph } from '../graph/validator';
import { CompileContext, type BuiltinUniform } from './compile-context';

const VERTEX_SHADER = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}`;

const BUILTIN_TYPE: Record<BuiltinUniform, string> = {
  uTime: 'float',
  uResolution: 'vec2',
  uMouse: 'vec2',
};
const BUILTIN_DEFAULT: Record<BuiltinUniform, unknown> = {
  uTime: 0,
  uResolution: [1, 1],
  uMouse: [0, 0],
};

export function compile(renderer: RendererNode): CompiledShader {
  assertValidGraph(renderer);
  const ctx = new CompileContext();
  const colorExpr = ctx.resolve(renderer.out.color);

  const declarations: string[] = [];
  const uniforms: Record<string, { value: unknown }> = {};

  for (const name of ctx.builtins) {
    declarations.push(`uniform ${BUILTIN_TYPE[name]} ${name};`);
    uniforms[name] = { value: BUILTIN_DEFAULT[name] };
  }
  for (const spec of ctx.uniforms.values()) {
    const array = spec.arraySize !== undefined ? `[${spec.arraySize}]` : '';
    declarations.push(`uniform ${spec.type} ${spec.name}${array};`);
    uniforms[spec.name] = { value: spec.value };
  }

  const preamble = [ctx.includeSource, ctx.helperSource].filter(Boolean).join('\n\n');

  const fragmentShader = [
    'precision highp float;',
    'varying vec2 vUv;',
    ...declarations,
    '',
    ...(preamble ? [preamble, ''] : []),
    'void main() {',
    ...ctx.lines,
    `  gl_FragColor = ${colorExpr};`,
    '}',
  ].join('\n');

  return { vertexShader: VERTEX_SHADER, fragmentShader, uniforms };
}
