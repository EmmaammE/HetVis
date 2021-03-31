const transpose = (a: number[][]) => a[0].map((x, i) => a.map((y) => y[i]));
const dotproduct = (a: number[], b: number[]) =>
  a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
const mmultiply = (a: number[][], b: number[][]) =>
  a.map((x) => transpose(b).map((y) => dotproduct(x, y)));


export {
  transpose,
  dotproduct,
  mmultiply
}