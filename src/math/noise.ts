// CPU mirror of the `saValueNoise` GLSL include. The hash is `fract`-based with
// no transcendentals, but `fract` of a large product still depends on bits the
// GPU truncates — so this matches shape and range, not exact per-pixel values.

const fract = (x: number) => x - Math.floor(x);

function hash21(px: number, py: number): number {
  let x = fract(px * 0.1031);
  let y = fract(py * 0.1031);
  let z = fract(px * 0.1031);
  const d = x * (y + 33.33) + y * (z + 33.33) + z * (x + 33.33);
  x += d;
  y += d;
  z += d;
  return fract((x + y) * z);
}

function valueNoise2D(px: number, py: number): number {
  const ix = Math.floor(px);
  const iy = Math.floor(py);
  const fx = px - ix;
  const fy = py - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash21(ix, iy);
  const b = hash21(ix + 1, iy);
  const c = hash21(ix, iy + 1);
  const d = hash21(ix + 1, iy + 1);
  const top = a + (b - a) * ux;
  const bottom = c + (d - c) * ux;
  return (top + (bottom - top) * uy) * 2 - 1;
}

export function fbm2D(
  px: number,
  py: number,
  octaves: number,
  lacunarity: number,
  gain: number,
): number {
  let sum = 0;
  let amp = 0.5;
  let x = px;
  let y = py;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise2D(x, y);
    x *= lacunarity;
    y *= lacunarity;
    amp *= gain;
  }
  return sum;
}
