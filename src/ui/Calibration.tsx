import { useEffect, useRef, useState, type RefObject } from 'react'
import { startLoop } from '../engine/loop'
import {
  assessHand,
  HINT_MESSAGE,
  type CalibrationHint,
} from '../vision/calibration'
import type { InputFrame } from '../vision/types'
import {
  drawBackdrop,
  drawCursor,
  drawLandmarks,
  STAGE_H,
  STAGE_W,
  toGameInput,
} from './stageDraw'

/** Tempo com a mão bem posicionada para considerar a calibração concluída. */
const READY_MS = 1200

interface Props {
  frameRef: RefObject<InputFrame | null>
  videoRef: RefObject<HTMLVideoElement | null>
  stageRef: RefObject<HTMLDivElement | null>
  onReady: () => void
  onSkip: () => void
  onCancel: () => void
}

export default function Calibration({
  frameRef,
  videoRef,
  stageRef,
  onReady,
  onSkip,
  onCancel,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hint, setHint] = useState<CalibrationHint>('no-hand')
  const [progress, setProgress] = useState(0)
  const onReadyRef = useRef(onReady)

  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    let okMs = 0
    let currentHint: CalibrationHint = 'no-hand'
    let lastProgress = -1
    let done = false

    const stop = startLoop((dt) => {
      const now = performance.now()
      const frame = frameRef.current
      const fresh = frame && now - frame.timestamp < 400 ? frame : null

      const next = assessHand(fresh?.landmarks ?? null)
      if (next !== currentHint) {
        currentHint = next
        setHint(next)
      }
      okMs = next === 'ok' ? okMs + dt : 0

      const p = Math.min(1, okMs / READY_MS)
      const rounded = Math.round(p * 20) / 20
      if (rounded !== lastProgress) {
        lastProgress = rounded
        setProgress(rounded)
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawBackdrop(ctx, videoRef.current, true, 0.85)
      if (fresh) drawLandmarks(ctx, fresh)
      drawCursor(ctx, toGameInput(frame, now))

      if (!done && okMs >= READY_MS) {
        done = true
        stop()
        onReadyRef.current()
      }
    })

    return stop
  }, [frameRef, videoRef])

  return (
    <section className="play">
      <h2>Posicione a mão</h2>
      <p className={`calib-hint ${hint === 'ok' ? 'ok' : ''}`} role="status">
        {HINT_MESSAGE[hint]}
      </p>
      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} />
      </div>
      <progress max={1} value={progress} aria-label="Progresso da calibração" />
      <div className="row">
        <button type="button" className="btn secondary" onClick={onCancel}>
          Voltar
        </button>
        <button type="button" className="btn secondary" onClick={onSkip}>
          Pular
        </button>
      </div>
      <p className="tip">
        Dica: apoie o aparelho, mantenha a mão a cerca de 30 a 50 cm da câmera e
        evite luz forte atrás de você.
      </p>
    </section>
  )
}
