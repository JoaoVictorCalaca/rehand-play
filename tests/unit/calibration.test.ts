import { describe, expect, it } from 'vitest'
import { assessHand } from '../../src/vision/calibration'
import { LM, type Landmark } from '../../src/vision/types'

/** Mão mínima: todos os pontos no centro, exceto o pulso e a base do dedo médio, que definem o tamanho. */
function hand(size: number, cx = 0.5, cy = 0.5): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({
    x: cx,
    y: cy,
    z: 0,
  }))
  lm[LM.WRIST] = { x: cx, y: cy + size / 2, z: 0 }
  lm[LM.MIDDLE_MCP] = { x: cx, y: cy - size / 2, z: 0 }
  return lm
}

describe('assessHand', () => {
  it('no-hand sem landmarks', () => {
    expect(assessHand(null)).toBe('no-hand')
    expect(assessHand([])).toBe('no-hand')
  })

  it('too-far quando a mão é pequena na imagem', () => {
    expect(assessHand(hand(0.05))).toBe('too-far')
  })

  it('too-close quando a mão é grande na imagem', () => {
    expect(assessHand(hand(0.5))).toBe('too-close')
  })

  it('edge quando algum ponto encosta na borda', () => {
    expect(assessHand(hand(0.2, 0.5, 0.12))).toBe('edge')
  })

  it('ok quando bem posicionada', () => {
    expect(assessHand(hand(0.2))).toBe('ok')
  })
})
