import { describe, expect, it } from 'vitest'
import { OneEuroFilter } from '../../src/vision/oneEuro'

describe('OneEuroFilter', () => {
  it('devolve o primeiro valor sem alterar', () => {
    const f = new OneEuroFilter()
    expect(f.filter(0.5, 0)).toBe(0.5)
  })

  it('reduz o tremor de um sinal parado', () => {
    const f = new OneEuroFilter({ minCutoff: 1, beta: 0 })
    const noisy = [0.5, 0.52, 0.48, 0.53, 0.47, 0.52, 0.48, 0.51, 0.49, 0.5]
    const out = noisy.map((v, i) => f.filter(v, i / 30))
    const range = (a: number[]) => Math.max(...a) - Math.min(...a)
    expect(range(out.slice(1))).toBeLessThan(range(noisy.slice(1)))
  })

  it('acompanha movimento rápido com menos atraso quando beta é maior', () => {
    const run = (beta: number) => {
      const f = new OneEuroFilter({ minCutoff: 1, beta })
      let y = 0
      for (let i = 0; i <= 30; i++) y = f.filter(i / 30, i / 30)
      return y
    }
    // Alvo final = 1. Quanto mais perto, menor o atraso.
    expect(1 - run(5)).toBeLessThan(1 - run(0))
  })

  it('ignora instantes não crescentes', () => {
    const f = new OneEuroFilter()
    f.filter(0.2, 1)
    expect(f.filter(0.9, 1)).toBe(0.2)
  })

  it('reset volta a aceitar o primeiro valor sem suavizar', () => {
    const f = new OneEuroFilter()
    f.filter(0.1, 0)
    f.filter(0.2, 0.03)
    f.reset()
    expect(f.filter(0.9, 1)).toBe(0.9)
  })
})
