import type { BugKind } from './specs'

export interface Bug {
  id: number
  kind: BugKind
  x: number
  y: number
  hp: number
  ageMs: number
  /** Direção do movimento (rad), usada para orientar o desenho. */
  heading: number
  wobblePhase: number
  stunMs: number
  dead: boolean
}

export interface Coin {
  id: number
  x: number
  y: number
  ageMs: number
  /** A mão aberta já tocou a moeda: agora fechar a mão a pega. */
  armed: boolean
  grabMs: number
  taken: boolean
}

export interface Splat {
  x: number
  y: number
  ageMs: number
  friendly: boolean
}

export interface Popup {
  x: number
  y: number
  text: string
  color: string
  ageMs: number
}

export interface TrailPoint {
  x: number
  y: number
  t: number
}

/** Tudo que o desenho precisa, sem expor a lógica. */
export interface BugSmashView {
  bugs: readonly Bug[]
  coins: readonly Coin[]
  splats: readonly Splat[]
  popups: readonly Popup[]
  trail: readonly TrailPoint[]
  slapping: boolean
  cakeShakeMs: number
  elapsed: number
}
