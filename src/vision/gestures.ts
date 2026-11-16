import { LM, type Gesture, type Landmark } from './types'

function dist(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/** Tamanho de referência da mão (pulso → base do dedo médio), para ser invariante à distância da câmera. */
export function handSize(lm: Landmark[]): number {
  return dist(lm[LM.WRIST], lm[LM.MIDDLE_MCP])
}

/** Um dedo (exceto o polegar) está estendido se a ponta está mais longe do pulso que a articulação PIP. */
function fingerExtended(lm: Landmark[], tip: number, pip: number): boolean {
  return dist(lm[tip], lm[LM.WRIST]) > dist(lm[pip], lm[LM.WRIST]) * 1.05
}

export interface FingerState {
  index: boolean
  middle: boolean
  ring: boolean
  pinky: boolean
}

export function fingerStates(lm: Landmark[]): FingerState {
  return {
    index: fingerExtended(lm, LM.INDEX_TIP, LM.INDEX_PIP),
    middle: fingerExtended(lm, LM.MIDDLE_TIP, LM.MIDDLE_PIP),
    ring: fingerExtended(lm, LM.RING_TIP, LM.RING_PIP),
    pinky: fingerExtended(lm, LM.PINKY_TIP, LM.PINKY_PIP),
  }
}

/** Distância polegar–indicador relativa ao tamanho da mão. */
export function pinchRatio(lm: Landmark[]): number {
  const size = handSize(lm)
  if (size === 0) return Infinity
  return dist(lm[LM.THUMB_TIP], lm[LM.INDEX_TIP]) / size
}

export interface GestureOptions {
  /** Razão abaixo da qual a pinça começa. */
  pinchOn?: number
  /** Razão acima da qual a pinça termina (histerese evita tremer entre estados). */
  pinchOff?: number
}

export interface GestureClassifier {
  classify(lm: Landmark[] | null): Gesture
  reset(): void
}

export function createGestureClassifier({
  pinchOn = 0.3,
  pinchOff = 0.45,
}: GestureOptions = {}): GestureClassifier {
  let pinching = false

  return {
    classify(lm) {
      if (!lm || lm.length < 21) {
        pinching = false
        return 'none'
      }

      const ratio = pinchRatio(lm)
      pinching = pinching ? ratio < pinchOff : ratio < pinchOn
      if (pinching) return 'pinch'

      const f = fingerStates(lm)
      const count = [f.index, f.middle, f.ring, f.pinky].filter(Boolean).length

      if (count === 4) return 'open'
      if (count === 0) return 'fist'
      if (f.index && !f.middle && !f.ring && !f.pinky) return 'point'
      return 'none'
    },
    reset() {
      pinching = false
    },
  }
}
