import { describe, expect, it } from 'vitest'
import { accuracy } from '../../src/engine/score'

describe('accuracy', () => {
  it('retorna 0 sem tentativas', () => {
    expect(accuracy(0, 0)).toBe(0)
  })

  it('calcula a porcentagem com 1 casa decimal', () => {
    expect(accuracy(2, 3)).toBe(66.7)
    expect(accuracy(5, 5)).toBe(100)
  })
})
