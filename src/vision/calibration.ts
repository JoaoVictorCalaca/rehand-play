import { handSize } from './gestures'
import type { Landmark } from './types'

export type CalibrationHint =
  'no-hand' | 'too-far' | 'too-close' | 'edge' | 'ok'

/** Tamanho da mão (pulso → base do dedo médio, normalizado) fora dessa faixa prejudica a detecção. */
export const MIN_HAND_SIZE = 0.09
export const MAX_HAND_SIZE = 0.35
const EDGE = 0.03

export const HINT_MESSAGE: Record<CalibrationHint, string> = {
  'no-hand':
    'Mostre a mão para a câmera. Em ambiente bem iluminado funciona melhor.',
  'too-far': 'Aproxime a mão da câmera.',
  'too-close': 'Afaste um pouco a mão da câmera.',
  edge: 'Mantenha a mão inteira dentro da imagem.',
  ok: 'Perfeito! Segure assim por um instante…',
}

/** Avalia se a mão está bem posicionada para jogar. */
export function assessHand(lm: Landmark[] | null): CalibrationHint {
  if (!lm || lm.length < 21) return 'no-hand'
  const size = handSize(lm)
  if (size < MIN_HAND_SIZE) return 'too-far'
  if (size > MAX_HAND_SIZE) return 'too-close'
  if (
    lm.some((p) => p.x < EDGE || p.x > 1 - EDGE || p.y < EDGE || p.y > 1 - EDGE)
  )
    return 'edge'
  return 'ok'
}
