import type { GameInput } from '../engine/types'
import { HAND_CONNECTIONS, type InputFrame } from '../vision/types'

export const STAGE_W = 800
export const STAGE_H = 600

/** Quadros de webcam mais velhos que isso são tratados como "sem mão". */
const STALE_MS = 400

/** Converte o último quadro de entrada no que o motor precisa. */
export function toGameInput(frame: InputFrame | null, now: number): GameInput {
  if (!frame) return { cursor: null, gesture: 'none' }
  const isCamera = frame.inferenceMs !== null
  if (isCamera && now - frame.timestamp > STALE_MS)
    return { cursor: null, gesture: 'none' }
  return { cursor: frame.cursor, gesture: frame.gesture }
}

/** Fundo do palco (em pixels). Opcionalmente mostra a câmera espelhada e esmaecida. */
export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  video: HTMLVideoElement | null,
  showCamera: boolean,
  cameraAlpha = 0.3,
): void {
  const g = ctx.createLinearGradient(0, 0, 0, STAGE_H)
  g.addColorStop(0, '#16302c')
  g.addColorStop(1, '#0d1a18')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, STAGE_W, STAGE_H)

  if (showCamera && video && video.readyState >= 2) {
    ctx.save()
    ctx.globalAlpha = cameraAlpha
    ctx.translate(STAGE_W, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(video, 0, 0, STAGE_W, STAGE_H)
    ctx.restore()
  }
}

/** Esqueleto da mão (em pixels). */
export function drawLandmarks(
  ctx: CanvasRenderingContext2D,
  frame: InputFrame,
): void {
  const lm = frame.landmarks
  if (!lm) return
  ctx.strokeStyle = 'rgba(127, 196, 179, 0.9)'
  ctx.lineWidth = 2
  for (const [a, b] of HAND_CONNECTIONS) {
    ctx.beginPath()
    ctx.moveTo(lm[a].x * STAGE_W, lm[a].y * STAGE_H)
    ctx.lineTo(lm[b].x * STAGE_W, lm[b].y * STAGE_H)
    ctx.stroke()
  }
  ctx.fillStyle = '#fff'
  for (const p of lm) {
    ctx.beginPath()
    ctx.arc(p.x * STAGE_W, p.y * STAGE_H, 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

/** Cursor do jogador (em pixels). */
export function drawCursor(
  ctx: CanvasRenderingContext2D,
  input: GameInput,
): void {
  if (!input.cursor) return
  const x = input.cursor.x * STAGE_W
  const y = input.cursor.y * STAGE_H
  const closed = input.gesture === 'fist' || input.gesture === 'pinch'
  ctx.save()
  ctx.fillStyle = closed
    ? 'rgba(255, 122, 89, 0.9)'
    : 'rgba(255, 209, 102, 0.9)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(x, y, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}
