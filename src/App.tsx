import { useCallback, useRef, useState } from 'react'
import type { SessionResult } from './engine/types'
import Calibration from './ui/Calibration'
import DebugView from './ui/DebugView'
import GameScreen from './ui/GameScreen'
import Menu, { type InputKind, type Settings } from './ui/Menu'
import Result from './ui/Result'
import { HandTrackingSource } from './vision/handTrackingSource'
import { MouseInputSource } from './vision/mouseSource'
import type { InputFrame } from './vision/types'
import { useInputSource } from './vision/useInputSource'

type Screen = 'menu' | 'calibration' | 'playing' | 'result' | 'debug'

const SETTINGS_KEY = 'rehand-play:settings'
const DEFAULT_SETTINGS: Settings = {
  difficulty: 'normal',
  input: 'camera',
  showCamera: true,
}

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw)
      return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) }
  } catch {
    // Sem localStorage: usa o padrão.
  }
  return DEFAULT_SETTINGS
}

function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s))
  } catch {
    // Ignora: salvar é só uma conveniência.
  }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu')
  const [settings, setSettings] = useState<Settings>(loadSettings)
  const [result, setResult] = useState<SessionResult | null>(null)
  const [loading, setLoading] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<InputFrame | null>(null)
  const activeInput = useRef<InputKind | null>(null)

  const onFrame = useCallback((f: InputFrame) => {
    frameRef.current = f
  }, [])
  const { error, start, stop } = useInputSource({
    onFrame,
    stateIntervalMs: 1000,
  })

  const changeSettings = (s: Settings) => {
    setSettings(s)
    saveSettings(s)
  }

  const toMenu = () => {
    stop()
    activeInput.current = null
    frameRef.current = null
    setScreen('menu')
  }

  const play = async () => {
    if (activeInput.current !== settings.input) {
      setLoading(true)
      const source =
        settings.input === 'camera'
          ? new HandTrackingSource({ video: videoRef.current! })
          : new MouseInputSource(() => stageRef.current)
      const ok = await start(source)
      setLoading(false)
      if (!ok) {
        activeInput.current = null
        return
      }
      activeInput.current = settings.input
    }
    setScreen(settings.input === 'camera' ? 'calibration' : 'playing')
  }

  const openDebug = () => {
    stop()
    activeInput.current = null
    setScreen('debug')
  }

  return (
    <main className="app">
      <header className="app-header">
        <h1>rehand-play</h1>
        <p>
          Reabilitação motora das mãos, de forma lúdica, direto no navegador.
        </p>
      </header>

      {/* Sempre montado: a câmera precisa de um <video> para alimentar o MediaPipe. */}
      <video ref={videoRef} className="hidden-video" playsInline muted />

      {screen === 'menu' && (
        <Menu
          settings={settings}
          onChange={changeSettings}
          onPlay={() => void play()}
          onDebug={openDebug}
          loading={loading}
          error={error}
        />
      )}

      {screen === 'calibration' && (
        <Calibration
          frameRef={frameRef}
          videoRef={videoRef}
          stageRef={stageRef}
          onReady={() => setScreen('playing')}
          onSkip={() => setScreen('playing')}
          onCancel={toMenu}
        />
      )}

      {screen === 'playing' && (
        <GameScreen
          difficulty={settings.difficulty}
          showCamera={settings.input === 'camera' && settings.showCamera}
          frameRef={frameRef}
          videoRef={videoRef}
          stageRef={stageRef}
          onFinish={(r) => {
            setResult(r)
            setScreen('result')
          }}
          onQuit={toMenu}
        />
      )}

      {screen === 'result' && result && (
        <Result
          result={result}
          onAgain={() =>
            setScreen(settings.input === 'camera' ? 'calibration' : 'playing')
          }
          onMenu={toMenu}
        />
      )}

      {screen === 'debug' && (
        <>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setScreen('menu')}
          >
            ← Voltar
          </button>
          <DebugView />
        </>
      )}

      <footer className="notice">
        Ferramenta lúdica e de apoio. Não é um dispositivo médico e não
        substitui o acompanhamento profissional.
      </footer>
    </main>
  )
}
