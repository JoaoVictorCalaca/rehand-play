import { useEffect, useRef, useState, type RefObject } from 'react'
import { startLoop } from '../engine/loop'
import type { Difficulty, Hud, SessionResult } from '../engine/types'
import { createGame } from '../games'
import type { InputFrame } from '../vision/types'
import {
  drawBackdrop,
  drawCursor,
  STAGE_H,
  STAGE_W,
  toGameInput,
} from './stageDraw'

interface Props {
  difficulty: Difficulty
  showCamera: boolean
  frameRef: RefObject<InputFrame | null>
  videoRef: RefObject<HTMLVideoElement | null>
  stageRef: RefObject<HTMLDivElement | null>
  onFinish: (result: SessionResult) => void
  onQuit: () => void
}

export default function GameScreen({
  difficulty,
  showCamera,
  frameRef,
  videoRef,
  stageRef,
  onFinish,
  onQuit,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hud, setHud] = useState<Hud>({
    score: 0,
    lives: 0,
    maxLives: 0,
    wave: 1,
    combo: 0,
    multiplier: 1,
    hint: '',
  })
  const onFinishRef = useRef(onFinish)

  useEffect(() => {
    onFinishRef.current = onFinish
  }, [onFinish])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const game = createGame(difficulty)
    let sinceHud = Infinity
    let finished = false

    const stop = startLoop((dt) => {
      const now = performance.now()
      const input = toGameInput(frameRef.current, now)

      game.update(dt, input)

      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawBackdrop(ctx, videoRef.current, showCamera)
      ctx.setTransform(STAGE_H, 0, 0, STAGE_H, 0, 0)
      game.render(ctx)
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      drawCursor(ctx, input)

      sinceHud += dt
      if (sinceHud >= 100) {
        sinceHud = 0
        setHud(game.hud())
      }

      if (!finished && game.isFinished()) {
        finished = true
        stop()
        onFinishRef.current(game.result())
      }
    })

    return stop
  }, [difficulty, showCamera, frameRef, videoRef])

  return (
    <section className="play">
      <div className="hud">
        <span className="hud-score">{hud.score} pts</span>
        <span>Onda {hud.wave}</span>
        <span
          className="hud-lives"
          role="img"
          aria-label={`${hud.lives} de ${hud.maxLives} vidas`}
        >
          {'♥'.repeat(hud.lives)}
          <span className="hud-lost">
            {'♥'.repeat(hud.maxLives - hud.lives)}
          </span>
        </span>
        <span className={`hud-combo ${hud.combo >= 5 ? 'hot' : ''}`}>
          {hud.combo > 1 ? `Combo ${hud.combo} · ×${hud.multiplier}` : ''}
        </span>
      </div>
      <p className="hud-hint" aria-live="polite">
        {hud.hint}
      </p>
      <div className="stage" ref={stageRef}>
        <canvas ref={canvasRef} width={STAGE_W} height={STAGE_H} />
      </div>
      <button type="button" className="btn secondary" onClick={onQuit}>
        Sair
      </button>
    </section>
  )
}
