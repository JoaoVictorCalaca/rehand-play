import type { SessionResult } from '../engine/types'
import { GAME_INFO } from '../games'

interface Props {
  result: SessionResult
  onAgain: () => void
  onMenu: () => void
}

const DIFFICULTY_LABEL = {
  easy: 'Fácil',
  normal: 'Normal',
  hard: 'Difícil',
} as const

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function Result({ result, onAgain, onMenu }: Props) {
  const stats: { label: string; value: string }[] = [
    { label: 'Pontos', value: String(result.score) },
    { label: 'Onda alcançada', value: String(result.wave) },
    { label: 'Insetos eliminados', value: String(result.bugsKilled) },
    { label: 'Chegaram ao bolo', value: String(result.bugsEscaped) },
    { label: 'Joaninhas atingidas', value: String(result.friendlySlaps) },
    {
      label: 'Moedas pegas',
      value: `${result.coinsCollected} de ${result.coinsCollected + result.coinsMissed}`,
    },
    { label: 'Maior combo', value: String(result.maxCombo) },
    { label: 'Precisão', value: `${result.accuracy.toFixed(0)}%` },
    {
      label: 'Reação média',
      value:
        result.avgReactionMs === null
          ? '—'
          : `${(result.avgReactionMs / 1000).toFixed(2)} s`,
    },
    {
      label: 'Velocidade do tapa',
      value:
        result.avgSlapSpeed === null
          ? '—'
          : `${result.avgSlapSpeed.toFixed(1)} u/s`,
    },
    { label: 'Duração', value: formatDuration(result.durationMs) },
  ]

  return (
    <section className="result">
      <h2>Fim de jogo</h2>
      <p className="result-sub">
        {GAME_INFO.name} · {DIFFICULTY_LABEL[result.difficulty]}
      </p>

      <dl className="result-grid">
        {stats.map((s) => (
          <div key={s.label}>
            <dt>{s.label}</dt>
            <dd>{s.value}</dd>
          </div>
        ))}
      </dl>

      <div className="row">
        <button type="button" className="btn" onClick={onAgain}>
          Jogar de novo
        </button>
        <button type="button" className="btn secondary" onClick={onMenu}>
          Menu
        </button>
      </div>
    </section>
  )
}
