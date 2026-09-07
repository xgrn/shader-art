export type Vec3 = readonly [number, number, number];

export const VERTICES: readonly Vec3[] = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];

export interface Face {
  /** Two triangles, vertex indices, wound CCW seen from outside. */
  tris: readonly (readonly [number, number, number])[];
  colour: Vec3;
}

export const FACES: readonly Face[] = [
  { tris: [[4, 5, 6], [4, 6, 7]], colour: [0.95, 0.36, 0.38] }, // front  +z
  { tris: [[1, 0, 3], [1, 3, 2]], colour: [0.36, 0.56, 0.96] }, // back   -z
  { tris: [[5, 1, 2], [5, 2, 6]], colour: [0.42, 0.86, 0.5] }, //  right  +x
  { tris: [[0, 4, 7], [0, 7, 3]], colour: [0.97, 0.8, 0.32] }, //  left   -x
  { tris: [[7, 6, 2], [7, 2, 3]], colour: [0.78, 0.46, 0.92] }, // top    +y
  { tris: [[0, 1, 5], [0, 5, 4]], colour: [0.35, 0.82, 0.86] }, // bottom -y
];
