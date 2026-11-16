/** Distância entre dois pontos. */
export function distance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(ax - bx, ay - by)
}

/** Menor distância do ponto (px, py) ao segmento A–B. */
export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return distance(px, py, ax, ay)
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2))
  return distance(px, py, ax + t * dx, ay + t * dy)
}

/** O segmento A–B toca o círculo de centro (cx, cy) e raio r? Evita "atravessar" alvos em movimentos rápidos. */
export function segmentHitsCircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  return distanceToSegment(cx, cy, ax, ay, bx, by) <= r
}

/** O ponto (px, py) está dentro do círculo de centro (cx, cy) e raio r? */
export function pointInCircle(
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number,
): boolean {
  return distance(px, py, cx, cy) <= r
}
