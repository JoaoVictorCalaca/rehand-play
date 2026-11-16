import { describe, expect, it } from 'vitest'
import { createGestureClassifier, pinchRatio } from '../../src/vision/gestures'
import { LM, type Landmark } from '../../src/vision/types'

type Pose = {
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
  /** Quando definido, leva a ponta do polegar até a ponta do indicador. */
  pinch?: boolean
}

const COLUMNS = { index: 0.4, middle: 0.5, ring: 0.6, pinky: 0.7 } as const

/** Mão sintética de 21 pontos, com o pulso embaixo e dedos apontando para cima. */
function makeHand(pose: Pose): Landmark[] {
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({
    x: 0.5,
    y: 0.9,
    z: 0,
  }))
  lm[LM.WRIST] = { x: 0.5, y: 0.9, z: 0 }

  const fingers = [
    ['index', LM.INDEX_MCP],
    ['middle', LM.MIDDLE_MCP],
    ['ring', LM.RING_MCP],
    ['pinky', LM.PINKY_MCP],
  ] as const

  for (const [name, mcp] of fingers) {
    const x = COLUMNS[name]
    const up = pose[name]
    lm[mcp] = { x, y: 0.7, z: 0 }
    lm[mcp + 1] = { x, y: up ? 0.55 : 0.6, z: 0 } // PIP
    lm[mcp + 2] = { x, y: up ? 0.45 : 0.65, z: 0 } // DIP
    lm[mcp + 3] = { x, y: up ? 0.35 : 0.7, z: 0 } // TIP
  }

  lm[LM.THUMB_CMC] = { x: 0.42, y: 0.85, z: 0 }
  lm[LM.THUMB_MCP] = { x: 0.35, y: 0.8, z: 0 }
  lm[LM.THUMB_IP] = { x: 0.3, y: 0.75, z: 0 }
  lm[LM.THUMB_TIP] = pose.pinch
    ? { ...lm[LM.INDEX_TIP], x: lm[LM.INDEX_TIP].x - 0.02 }
    : { x: 0.25, y: 0.7, z: 0 }

  return lm
}

describe('createGestureClassifier', () => {
  it('retorna none sem mão', () => {
    const c = createGestureClassifier()
    expect(c.classify(null)).toBe('none')
    expect(c.classify([])).toBe('none')
  })

  it('reconhece mão aberta', () => {
    const c = createGestureClassifier()
    expect(
      c.classify(
        makeHand({ index: true, middle: true, ring: true, pinky: true }),
      ),
    ).toBe('open')
  })

  it('reconhece punho', () => {
    const c = createGestureClassifier()
    expect(
      c.classify(
        makeHand({ index: false, middle: false, ring: false, pinky: false }),
      ),
    ).toBe('fist')
  })

  it('reconhece apontar com o indicador', () => {
    const c = createGestureClassifier()
    expect(
      c.classify(
        makeHand({ index: true, middle: false, ring: false, pinky: false }),
      ),
    ).toBe('point')
  })

  it('reconhece pinça mesmo com os outros dedos abertos', () => {
    const c = createGestureClassifier()
    const hand = makeHand({
      index: true,
      middle: true,
      ring: true,
      pinky: true,
      pinch: true,
    })
    expect(pinchRatio(hand)).toBeLessThan(0.3)
    expect(c.classify(hand)).toBe('pinch')
  })

  it('usa histerese: a pinça só termina acima do limite de saída', () => {
    const c = createGestureClassifier({ pinchOn: 0.3, pinchOff: 0.45 })
    const base = { index: true, middle: true, ring: true, pinky: true }
    expect(c.classify(makeHand({ ...base, pinch: true }))).toBe('pinch')

    // Afasta o polegar a uma razão entre 0.3 e 0.45: continua em pinça.
    const mid = makeHand({ ...base, pinch: true })
    mid[LM.THUMB_TIP] = { ...mid[LM.THUMB_TIP], x: mid[LM.THUMB_TIP].x - 0.07 }
    const r = pinchRatio(mid)
    expect(r).toBeGreaterThan(0.3)
    expect(r).toBeLessThan(0.45)
    expect(c.classify(mid)).toBe('pinch')

    // Afasta de vez: solta.
    expect(c.classify(makeHand(base))).toBe('open')
  })
})
