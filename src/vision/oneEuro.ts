/**
 * Filtro One Euro (Casiez et al., 2012): suaviza o tremor quando o dedo
 * está parado e reduz o atraso quando ele se move rápido.
 */
export interface OneEuroOptions {
  /** Frequência de corte mínima (Hz). Menor = mais suave, mais atraso. */
  minCutoff?: number
  /** Ganho da velocidade. Maior = menos atraso em movimentos rápidos. */
  beta?: number
  /** Corte usado na estimativa da derivada (Hz). */
  dCutoff?: number
}

function alpha(cutoff: number, dt: number): number {
  const tau = 1 / (2 * Math.PI * cutoff)
  return 1 / (1 + tau / dt)
}

export class OneEuroFilter {
  private readonly minCutoff: number
  private readonly beta: number
  private readonly dCutoff: number
  private xPrev: number | null = null
  private dxPrev = 0
  private tPrev = 0

  constructor({
    minCutoff = 1.0,
    beta = 0.007,
    dCutoff = 1.0,
  }: OneEuroOptions = {}) {
    this.minCutoff = minCutoff
    this.beta = beta
    this.dCutoff = dCutoff
  }

  /** @param t instante em segundos (deve ser crescente) */
  filter(x: number, t: number): number {
    if (this.xPrev === null) {
      this.xPrev = x
      this.tPrev = t
      return x
    }
    const dt = t - this.tPrev
    if (dt <= 0) return this.xPrev

    const dx = (x - this.xPrev) / dt
    const aD = alpha(this.dCutoff, dt)
    const dxHat = aD * dx + (1 - aD) * this.dxPrev

    const cutoff = this.minCutoff + this.beta * Math.abs(dxHat)
    const a = alpha(cutoff, dt)
    const xHat = a * x + (1 - a) * this.xPrev

    this.xPrev = xHat
    this.dxPrev = dxHat
    this.tPrev = t
    return xHat
  }

  reset(): void {
    this.xPrev = null
    this.dxPrev = 0
    this.tPrev = 0
  }
}
