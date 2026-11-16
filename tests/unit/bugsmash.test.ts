import { describe, expect, it } from 'vitest'
import {
  distanceToSegment,
  segmentHitsCircle,
} from '../../src/engine/collision'
import { WORLD_H, WORLD_W, type GameInput } from '../../src/engine/types'
import { BugSmashGame } from '../../src/games/bugsmash/game'
import { CAKE_X, CAKE_Y, comboMultiplier } from '../../src/games/bugsmash/specs'

const NO_HAND: GameInput = { cursor: null, gesture: 'none' }
const FRAME = 16

function at(
  x: number,
  y: number,
  gesture: GameInput['gesture'] = 'open',
): GameInput {
  return { cursor: { x: x / WORLD_W, y: y / WORLD_H }, gesture }
}

function idle(g: BugSmashGame, ms: number, input: GameInput = NO_HAND): void {
  for (let t = 0; t < ms; t += FRAME) g.update(FRAME, input)
}

/** Passa a mão horizontalmente, com `distance` unidades em `frames` quadros, centrada em (x, y). */
function swipe(
  g: BugSmashGame,
  x: number,
  y: number,
  { distance = 0.5, frames = 6, gesture = 'open' as GameInput['gesture'] } = {},
): void {
  for (let i = 0; i <= frames; i++) {
    const cx = x - distance / 2 + (distance * i) / frames
    g.update(FRAME, at(cx, y, gesture))
  }
  g.update(FRAME, NO_HAND) // solta o rastro
}

/** Jogo com a pausa inicial já consumida e sem insetos automáticos atrapalhando. */
function newGame(
  difficulty: 'easy' | 'normal' | 'hard' = 'normal',
): BugSmashGame {
  return new BugSmashGame(difficulty, () => 0.5)
}

describe('collision helpers', () => {
  it('distanceToSegment', () => {
    expect(distanceToSegment(0, 1, -1, 0, 1, 0)).toBeCloseTo(1)
    expect(distanceToSegment(3, 0, -1, 0, 1, 0)).toBeCloseTo(2) // além da ponta
    expect(distanceToSegment(1, 1, 0, 0, 0, 0)).toBeCloseTo(Math.SQRT2) // segmento degenerado
  })

  it('segmentHitsCircle detecta alvo no meio do caminho', () => {
    expect(segmentHitsCircle(-1, 0, 1, 0, 0, 0.05, 0.1)).toBe(true)
    expect(segmentHitsCircle(-1, 0, 1, 0, 0, 0.5, 0.1)).toBe(false)
  })
})

describe('comboMultiplier', () => {
  it('sobe 0,5 a cada 5 de combo até ×3', () => {
    expect(comboMultiplier(0)).toBe(1)
    expect(comboMultiplier(4)).toBe(1)
    expect(comboMultiplier(5)).toBe(1.5)
    expect(comboMultiplier(10)).toBe(2)
    expect(comboMultiplier(100)).toBe(3)
  })
})

describe('BugSmashGame: tapas', () => {
  it('um tapa rápido elimina um mosquito', () => {
    const g = newGame()
    g.spawnBug('mosquito', 0.6, 0.4)
    swipe(g, 0.6, 0.4)
    const r = g.result()
    expect(r.bugsKilled).toBe(1)
    expect(r.score).toBe(100)
  })

  it('movimento lento não conta como tapa', () => {
    const g = newGame()
    g.spawnBug('mosquito', 0.6, 0.4)
    swipe(g, 0.6, 0.4, { distance: 0.08, frames: 6 }) // ~0,8 u/s... abaixo do limite
    expect(g.result().bugsKilled).toBe(0)
  })

  it('mão fechada não dá tapa', () => {
    const g = newGame()
    g.spawnBug('mosquito', 0.6, 0.4)
    swipe(g, 0.6, 0.4, { gesture: 'fist' })
    expect(g.result().bugsKilled).toBe(0)
  })

  it('tapa rápido que "pula" o inseto entre dois quadros ainda acerta', () => {
    const g = newGame()
    g.spawnBug('mosquito', 0.6, 0.4)
    // Só 2 quadros: o cursor nunca fica em cima do inseto, mas o segmento cruza.
    swipe(g, 0.6, 0.4, { distance: 0.6, frames: 2 })
    expect(g.result().bugsKilled).toBe(1)
  })

  it('besouro precisa de 2 tapas e fica atordoado entre eles', () => {
    const g = newGame()
    g.spawnBug('beetle', 0.6, 0.4)
    swipe(g, 0.6, 0.4)
    expect(g.result().bugsKilled).toBe(0)
    // Ainda atordoado: um tapa imediato não conta de novo.
    const bug = g.view.bugs[0]
    swipe(g, bug.x, bug.y)
    expect(g.result().bugsKilled).toBe(0)

    idle(g, 500) // passa o atordoamento
    const b2 = g.view.bugs[0]
    swipe(g, b2.x, b2.y)
    expect(g.result().bugsKilled).toBe(1)
    expect(g.result().score).toBe(250)
    expect(g.result().avgSlapSpeed).not.toBeNull()
  })

  it('tapa em joaninha custa uma vida e zera o combo', () => {
    const g = newGame()
    const lives = g.hud().lives
    g.spawnBug('ladybug', 0.6, 0.4)
    swipe(g, 0.6, 0.4)
    expect(g.hud().lives).toBe(lives - 1)
    expect(g.result().friendlySlaps).toBe(1)
    expect(g.result().bugsKilled).toBe(0)
  })

  it('combo de 5 aplica ×1,5 no quinto inseto', () => {
    const g = newGame()
    for (let i = 0; i < 5; i++) {
      g.spawnBug('mosquito', 0.4 + i * 0.1, 0.3)
      swipe(g, 0.4 + i * 0.1, 0.3)
    }
    // 4 × 100 + 150
    expect(g.result().score).toBe(550)
    expect(g.result().maxCombo).toBe(5)
  })
})

describe('BugSmashGame: vidas', () => {
  it('inseto que chega ao piquenique tira uma vida', () => {
    const g = newGame()
    const lives = g.hud().lives
    g.spawnBug('mosquito', CAKE_X, CAKE_Y - 0.05)
    idle(g, 100)
    expect(g.hud().lives).toBe(lives - 1)
    expect(g.result().bugsEscaped).toBe(1)
  })

  it('joaninha que chega ao piquenique não custa vida', () => {
    const g = newGame()
    const lives = g.hud().lives
    g.spawnBug('ladybug', CAKE_X, CAKE_Y - 0.05)
    idle(g, 100)
    expect(g.hud().lives).toBe(lives)
  })

  it('fim de jogo quando as vidas acabam', () => {
    const g = newGame('hard') // 4 vidas
    for (let i = 0; i < 4; i++) g.spawnBug('mosquito', CAKE_X, CAKE_Y - 0.05)
    idle(g, 100)
    expect(g.isFinished()).toBe(true)
    const before = g.result().durationMs
    g.update(100, NO_HAND)
    expect(g.result().durationMs).toBe(before)
  })
})

describe('BugSmashGame: moedas', () => {
  it('pega a moeda: mão aberta sobre ela e depois fecha', () => {
    const g = newGame()
    g.spawnCoin(0.6, 0.4)
    idle(g, 100, at(0.6, 0.4, 'open'))
    idle(g, 200, at(0.6, 0.4, 'fist'))
    const r = g.result()
    expect(r.coinsCollected).toBe(1)
    expect(r.score).toBe(50)
  })

  it('o dedo pode se deslocar ao fechar a mão e ainda pega', () => {
    const g = newGame()
    g.spawnCoin(0.6, 0.4)
    idle(g, 100, at(0.6, 0.4, 'open'))
    idle(g, 200, at(0.6, 0.55, 'fist')) // a ponta do dedo desceu 0,15
    expect(g.result().coinsCollected).toBe(1)
  })

  it('já começar com a mão fechada não pega (precisa abrir antes)', () => {
    const g = newGame()
    g.spawnCoin(0.6, 0.4)
    idle(g, 400, at(0.6, 0.4, 'fist'))
    expect(g.result().coinsCollected).toBe(0)
  })

  it('moeda não pega se a mão está longe', () => {
    const g = newGame()
    g.spawnCoin(0.6, 0.4)
    idle(g, 100, at(1.1, 0.8, 'open'))
    idle(g, 300, at(1.1, 0.8, 'fist'))
    expect(g.result().coinsCollected).toBe(0)
  })

  it('moeda expira e conta como perdida', () => {
    const g = newGame()
    g.spawnCoin(0.6, 0.4)
    idle(g, 3600)
    expect(g.result().coinsMissed).toBe(1)
  })

  it('a cada 5 moedas recupera uma vida', () => {
    const g = newGame()
    g.spawnBug('mosquito', CAKE_X, CAKE_Y - 0.05)
    idle(g, 100) // perde 1 vida
    const afterLoss = g.hud().lives
    for (let i = 0; i < 5; i++) {
      g.spawnCoin(0.4 + 0.05 * i, 0.4)
      idle(g, 100, at(0.4 + 0.05 * i, 0.4, 'open'))
      idle(g, 200, at(0.4 + 0.05 * i, 0.4, 'fist'))
      idle(g, 100)
    }
    expect(g.result().coinsCollected).toBe(5)
    expect(g.hud().lives).toBe(afterLoss + 1)
  })
})

describe('BugSmashGame: ondas', () => {
  it('começa com uma pausa e depois solta insetos', () => {
    const g = newGame()
    idle(g, 1000)
    expect(g.view.bugs.length).toBe(0)
    expect(g.hud().hint).toContain('Onda 1')
    idle(g, 1000)
    expect(g.view.bugs.length).toBeGreaterThan(0)
  })

  it('só aparecem joaninhas e besouros a partir da onda 2', () => {
    const g = newGame()
    // Esvazia a onda 1 apenas deixando passar insetos até o piquenique é lento;
    // basta checar a composição: a onda 1 usa só mosquitos.
    idle(g, 3000)
    expect(g.view.bugs.every((b) => b.kind === 'mosquito')).toBe(true)
  })

  it('insetos nascem fora da tela e andam em direção ao piquenique', () => {
    const g = newGame()
    idle(g, 1600)
    const bug = g.view.bugs[0]
    const d0 = Math.hypot(bug.x - CAKE_X, bug.y - CAKE_Y)
    idle(g, 500)
    const d1 = Math.hypot(g.view.bugs[0].x - CAKE_X, g.view.bugs[0].y - CAKE_Y)
    expect(d1).toBeLessThan(d0)
  })
})
