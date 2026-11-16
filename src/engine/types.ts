import type { Gesture, Point } from '../vision/types'

/** O mundo do jogo tem altura 1 e largura 4/3 (palco 4:3). Todas as medidas usam essas unidades. */
export const WORLD_W = 4 / 3
export const WORLD_H = 1

export type Difficulty = 'easy' | 'normal' | 'hard'

/** O que o motor enxerga do jogador, sem saber se veio da câmera ou do mouse. */
export interface GameInput {
  /** Cursor normalizado (0–1); null se não há mão. */
  cursor: Point | null
  gesture: Gesture
}

export interface Hud {
  score: number
  lives: number
  maxLives: number
  wave: number
  combo: number
  multiplier: number
  hint: string
}

export interface SessionResult {
  difficulty: Difficulty
  durationMs: number
  score: number
  /** Onda em que a sessão terminou. */
  wave: number
  bugsKilled: number
  /** Insetos que chegaram ao piquenique. */
  bugsEscaped: number
  /** Joaninhas atingidas por engano. */
  friendlySlaps: number
  coinsCollected: number
  coinsMissed: number
  maxCombo: number
  /** Acertos / (acertos + falhas), 0–100. Acertos = insetos + moedas. */
  accuracy: number
  /** Tempo médio de reação em ms (inseto ou moeda); null sem acertos. */
  avgReactionMs: number | null
  /** Velocidade média dos tapas em unidades/s (proxy da amplitude e rapidez do movimento). */
  avgSlapSpeed: number | null
  playedAt: number
}

export interface Game {
  update(dtMs: number, input: GameInput): void
  /** Desenha em unidades do mundo (o chamador já aplicou a escala). */
  render(ctx: CanvasRenderingContext2D): void
  hud(): Hud
  isFinished(): boolean
  result(): SessionResult
}
