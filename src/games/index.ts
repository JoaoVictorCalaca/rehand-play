import type { Difficulty, Game } from '../engine/types'
import { BugSmashGame } from './bugsmash/game'

export const GAME_INFO = {
  name: 'Guardião do Piquenique',
  tagline: 'Proteja o bolo dos insetos usando só as mãos.',
  rules: [
    {
      title: 'Tapa rápido',
      text: 'Com a mão aberta, passe rápido por cima dos insetos para eliminá-los. Os besouros aguentam 2 tapas e o chefão, bem mais.',
      exercise: 'Extensão dos dedos e amplitude do movimento',
    },
    {
      title: 'Poupe as joaninhas',
      text: 'Elas são amigas. Bater numa joaninha custa uma vida.',
      exercise: 'Controle e precisão',
    },
    {
      title: 'Pegue as moedas',
      text: 'Aproxime a mão aberta da moeda e feche a mão para pegar. A cada 5 moedas você recupera uma vida.',
      exercise: 'Flexão dos dedos (o gesto de pegar)',
    },
  ],
} as const

export function createGame(difficulty: Difficulty): Game {
  return new BugSmashGame(difficulty)
}
