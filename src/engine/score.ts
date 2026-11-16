/** Precisão em porcentagem (0–100), arredondada para 1 casa. */
export function accuracy(hits: number, attempts: number): number {
  if (attempts <= 0) return 0
  return Math.round((hits / attempts) * 1000) / 10
}
