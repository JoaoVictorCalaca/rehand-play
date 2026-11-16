import type { Difficulty } from '../engine/types'
import { GAME_INFO } from '../games'

export type InputKind = 'camera' | 'mouse'

export interface Settings {
  difficulty: Difficulty
  input: InputKind
  showCamera: boolean
}

interface Props {
  settings: Settings
  onChange: (s: Settings) => void
  onPlay: () => void
  onDebug: () => void
  loading: boolean
  error: string | null
}

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  {
    id: 'easy',
    label: 'Fácil',
    hint: '6 vidas, insetos mais lentos, tapa mais leve',
  },
  { id: 'normal', label: 'Normal', hint: '5 vidas' },
  {
    id: 'hard',
    label: 'Difícil',
    hint: '4 vidas, insetos rápidos, tapa mais firme',
  },
]

export default function Menu({
  settings,
  onChange,
  onPlay,
  onDebug,
  loading,
  error,
}: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })
  const current = DIFFICULTIES.find((d) => d.id === settings.difficulty)

  return (
    <section className="menu">
      <h2>{GAME_INFO.name}</h2>
      <p>{GAME_INFO.tagline}</p>

      <ul className="rules">
        {GAME_INFO.rules.map((r) => (
          <li key={r.title}>
            <strong>{r.title}</strong>
            <span>{r.text}</span>
            <span className="card-exercise">Trabalha: {r.exercise}</span>
          </li>
        ))}
      </ul>

      <fieldset>
        <legend>Dificuldade</legend>
        <div className="row">
          {DIFFICULTIES.map((d) => (
            <label key={d.id} className="pill">
              <input
                type="radio"
                name="difficulty"
                checked={settings.difficulty === d.id}
                onChange={() => set({ difficulty: d.id })}
              />
              {d.label}
            </label>
          ))}
        </div>
        <p className="tip">{current?.hint}</p>
      </fieldset>

      <fieldset>
        <legend>Controle</legend>
        <div className="row">
          <label className="pill">
            <input
              type="radio"
              name="input"
              checked={settings.input === 'camera'}
              onChange={() => set({ input: 'camera' })}
            />
            Câmera (mão)
          </label>
          <label className="pill">
            <input
              type="radio"
              name="input"
              checked={settings.input === 'mouse'}
              onChange={() => set({ input: 'mouse' })}
            />
            Mouse
          </label>
        </div>
        {settings.input === 'camera' && (
          <label className="check">
            <input
              type="checkbox"
              checked={settings.showCamera}
              onChange={(e) => set({ showCamera: e.target.checked })}
            />
            Mostrar a imagem da câmera ao fundo
          </label>
        )}
        {settings.input === 'mouse' && (
          <p className="tip">
            Mova o mouse rápido para dar o tapa. Para pegar moedas, pouse o
            cursor nela e segure o botão (equivale a fechar a mão).
          </p>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}

      <div className="row">
        <button
          type="button"
          className="btn"
          onClick={onPlay}
          disabled={loading}
        >
          {loading ? 'Carregando…' : 'Jogar'}
        </button>
        <button type="button" className="btn secondary" onClick={onDebug}>
          Depuração
        </button>
      </div>
      <p className="tip">
        A câmera é processada no seu navegador. Nenhum vídeo é enviado a
        servidor.
      </p>
    </section>
  )
}
