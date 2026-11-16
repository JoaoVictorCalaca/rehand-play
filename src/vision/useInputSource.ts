import { useCallback, useEffect, useRef, useState } from 'react'
import type { InputFrame, InputSource } from './types'

export type InputStatus = 'idle' | 'loading' | 'running' | 'error'

interface Options {
  /** Chamado a cada frame (use para desenhar em canvas sem re-renderizar o React). */
  onFrame?: (frame: InputFrame) => void
  /** Intervalo mínimo (ms) entre atualizações do estado do React. */
  stateIntervalMs?: number
}

/**
 * Gerencia o ciclo de vida de uma InputSource. O estado do React é atualizado
 * em baixa frequência (para a interface); o desenho deve usar `onFrame`.
 */
export function useInputSource({
  onFrame,
  stateIntervalMs = 100,
}: Options = {}) {
  const [status, setStatus] = useState<InputStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [frame, setFrame] = useState<InputFrame | null>(null)
  const sourceRef = useRef<InputSource | null>(null)
  const unsubRef = useRef<(() => void) | null>(null)
  const onFrameRef = useRef(onFrame)
  const lastStateAt = useRef(0)

  useEffect(() => {
    onFrameRef.current = onFrame
  }, [onFrame])

  const stop = useCallback(() => {
    unsubRef.current?.()
    unsubRef.current = null
    sourceRef.current?.stop()
    sourceRef.current = null
    setStatus('idle')
    setFrame(null)
  }, [])

  const start = useCallback(
    async (source: InputSource) => {
      stop()
      setError(null)
      setStatus('loading')
      sourceRef.current = source
      try {
        unsubRef.current = source.subscribe((f) => {
          onFrameRef.current?.(f)
          if (f.timestamp - lastStateAt.current >= stateIntervalMs) {
            lastStateAt.current = f.timestamp
            setFrame(f)
          }
        })
        await source.start()
        if (sourceRef.current === source) setStatus('running')
      } catch (e) {
        source.stop()
        if (sourceRef.current === source) {
          sourceRef.current = null
          setError(describeError(e))
          setStatus('error')
        }
      }
    },
    [stop, stateIntervalMs],
  )

  useEffect(() => stop, [stop])

  return { status, error, frame, start, stop }
}

function describeError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotAllowedError') return 'Permissão da câmera negada.'
    if (e.name === 'NotFoundError') return 'Nenhuma câmera encontrada.'
  }
  return e instanceof Error
    ? e.message
    : 'Erro desconhecido ao iniciar a entrada.'
}
