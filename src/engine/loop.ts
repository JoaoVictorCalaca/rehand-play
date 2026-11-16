/**
 * Loop com requestAnimationFrame. O `dt` é limitado a 100 ms para que uma
 * aba em segundo plano não cause um salto enorme no jogo.
 * Retorna a função que interrompe o loop.
 */
export function startLoop(tick: (dtMs: number) => void): () => void {
  let id = 0
  let running = true
  let last = performance.now()

  const frame = (now: number): void => {
    if (!running) return
    const dt = Math.min(now - last, 100)
    last = now
    tick(dt)
    id = requestAnimationFrame(frame)
  }
  id = requestAnimationFrame(frame)

  return () => {
    running = false
    cancelAnimationFrame(id)
  }
}
