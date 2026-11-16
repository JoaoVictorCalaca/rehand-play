import { useCallback, useRef } from 'react'
import { HandTrackingSource } from '../vision/handTrackingSource'
import { MouseInputSource } from '../vision/mouseSource'
import { HAND_CONNECTIONS, type InputFrame } from '../vision/types'
import { useInputSource } from '../vision/useInputSource'

const GESTURE_LABEL: Record<InputFrame['gesture'], string> = {
  none: '—',
  open: 'Mão aberta',
  fist: 'Punho',
  pinch: 'Pinça',
  point: 'Apontar',
}

function draw(canvas: HTMLCanvasElement, frame: InputFrame): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width: w, height: h } = canvas
  ctx.clearRect(0, 0, w, h)

  const lm = frame.landmarks
  if (lm) {
    ctx.strokeStyle = 'rgba(127, 196, 179, 0.9)'
    ctx.lineWidth = 2
    for (const [a, b] of HAND_CONNECTIONS) {
      ctx.beginPath()
      ctx.moveTo(lm[a].x * w, lm[a].y * h)
      ctx.lineTo(lm[b].x * w, lm[b].y * h)
      ctx.stroke()
    }
    ctx.fillStyle = '#fff'
    for (const p of lm) {
      ctx.beginPath()
      ctx.arc(p.x * w, p.y * h, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  if (frame.cursor) {
    ctx.fillStyle = frame.gesture === 'pinch' ? '#ff7a59' : '#ffd166'
    ctx.beginPath()
    ctx.arc(frame.cursor.x * w, frame.cursor.y * h, 10, 0, Math.PI * 2)
    ctx.fill()
  }
}

export default function DebugView() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)

  const onFrame = useCallback((f: InputFrame) => {
    if (canvasRef.current) draw(canvasRef.current, f)
  }, [])
  const { status, error, frame, start, stop } = useInputSource({ onFrame })

  const startCamera = () => {
    if (!videoRef.current) return
    void start(new HandTrackingSource({ video: videoRef.current }))
  }
  const startMouse = () => {
    if (!stageRef.current) return
    void start(new MouseInputSource(stageRef.current))
  }

  const busy = status === 'loading'

  return (
    <section className="debug">
      <h2>Depuração da entrada</h2>

      <div className="debug-actions">
        <button type="button" onClick={startCamera} disabled={busy}>
          Usar câmera
        </button>
        <button type="button" onClick={startMouse} disabled={busy}>
          Usar mouse
        </button>
        <button type="button" onClick={stop} disabled={status === 'idle'}>
          Parar
        </button>
      </div>

      {status === 'loading' && <p>Carregando…</p>}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}

      <div className="stage" ref={stageRef}>
        <video ref={videoRef} playsInline muted />
        <canvas ref={canvasRef} width={640} height={480} />
      </div>

      <dl className="stats">
        <dt>Estado</dt>
        <dd>{status}</dd>
        <dt>Gesto</dt>
        <dd>{frame ? GESTURE_LABEL[frame.gesture] : '—'}</dd>
        <dt>Cursor</dt>
        <dd>
          {frame?.cursor
            ? `${frame.cursor.x.toFixed(2)}, ${frame.cursor.y.toFixed(2)}`
            : '—'}
        </dd>
        <dt>Inferência</dt>
        <dd>
          {frame?.inferenceMs != null
            ? `${frame.inferenceMs.toFixed(1)} ms`
            : '—'}
        </dd>
      </dl>
    </section>
  )
}
