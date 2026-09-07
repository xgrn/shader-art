export interface Include {
  deps: string[];
  code: string;
}

/**
 * GLSL helper functions injected into compiled fragment shaders on demand via
 * `CompileContext.require(name)`.
 */
export const INCLUDES: Record<string, Include> = {
  saHash21: {
    deps: [],
    code: `float sa_hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.x, p.y, p.x) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}`,
  },
  saValueNoise: {
    deps: ['saHash21'],
    code: `float sa_valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = sa_hash21(i);
  float b = sa_hash21(i + vec2(1.0, 0.0));
  float c = sa_hash21(i + vec2(0.0, 1.0));
  float d = sa_hash21(i + vec2(1.0, 1.0));
  return (mix(mix(a, b, u.x), mix(c, d, u.x), u.y)) * 2.0 - 1.0;
}`,
  },
};
