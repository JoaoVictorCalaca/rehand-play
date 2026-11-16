import type { Difficulty } from '../../engine/types'

export type BugKind = 'mosquito' | 'beetle' | 'ladybug' | 'boss'

export interface BugSpec {
  radius: number
  /** Unidades do mundo por segundo. */
  speed: number
  hp: number
  points: number
  /** Amigável: bater nela custa uma vida. */
  friendly: boolean
  /** Chance de largar uma moeda ao morrer. */
  coinChance: number
}

export const BUG_SPECS: Record<BugKind, BugSpec> = {
  mosquito: {
    radius: 0.045,
    speed: 0.2,
    hp: 1,
    points: 100,
    friendly: false,
    coinChance: 0.1,
  },
  beetle: {
    radius: 0.07,
    speed: 0.11,
    hp: 2,
    points: 250,
    friendly: false,
    coinChance: 0.6,
  },
  ladybug: {
    radius: 0.05,
    speed: 0.13,
    hp: 1,
    points: 0,
    friendly: true,
    coinChance: 0,
  },
  boss: {
    radius: 0.12,
    speed: 0.05,
    hp: 8,
    points: 1500,
    friendly: false,
    coinChance: 1,
  },
}

export interface DifficultyConfig {
  /** Multiplica a velocidade dos insetos. */
  speedMul: number
  /** Velocidade mínima do cursor para contar como tapa (unidades/s). */
  slapSpeed: number
  lives: number
  /** Multiplica o intervalo entre insetos (maior = mais calmo). */
  spawnMul: number
}

export const DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  easy: { speedMul: 0.75, slapSpeed: 0.8, lives: 6, spawnMul: 1.25 },
  normal: { speedMul: 1, slapSpeed: 1.1, lives: 5, spawnMul: 1 },
  hard: { speedMul: 1.3, slapSpeed: 1.5, lives: 4, spawnMul: 0.8 },
}

/** Posição do piquenique, que os insetos tentam alcançar. */
export const CAKE_X = 2 / 3
export const CAKE_Y = 0.88
export const CAKE_REACH = 0.09

export const COIN_RADIUS = 0.06
/** Folga para o toque na moeda (o cursor é a ponta do indicador e tremula). */
export const COIN_TOUCH_SLACK = 0.03
/** Depois de "armada", a moeda continua válida dentro deste raio, porque a ponta do dedo se desloca ao fechar a mão. */
export const COIN_GRAB_RADIUS = 0.22
export const COIN_LIFE_MS = 3500
export const COIN_HOLD_MS = 120
export const COIN_VALUE = 50
export const COINS_PER_LIFE = 5

export const SLAP_SLACK = 0.03
export const STUN_MS = 350
export const TRAIL_MS = 140
export const COMBO_WINDOW_MS = 2000

/** Multiplicador de pontos: +0,5 a cada 5 de combo, até ×3. */
export function comboMultiplier(combo: number): number {
  return 1 + Math.min(4, Math.floor(combo / 5)) * 0.5
}
