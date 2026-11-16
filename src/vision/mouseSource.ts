import type { InputFrame, InputListener, InputSource } from './types'

/**
 * Fallback: o mouse vira o cursor e o botão pressionado vira "pinça".
 * Permite jogar e testar sem webcam.
 */
export class MouseInputSource implements InputSource {
  private listeners = new Set<InputListener>()
  private pressed = false
  private last = { x: 0.5, y: 0.5 }
  private active = false

  private readonly target: HTMLElement

  constructor(target: HTMLElement) {
    this.target = target
  }

  async start(): Promise<void> {
    if (this.active) return
    this.active = true
    this.target.addEventListener('pointermove', this.onMove)
    this.target.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointerup', this.onUp)
  }

  stop(): void {
    this.active = false
    this.target.removeEventListener('pointermove', this.onMove)
    this.target.removeEventListener('pointerdown', this.onDown)
    window.removeEventListener('pointerup', this.onUp)
    this.listeners.clear()
  }

  subscribe(listener: InputListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private emit(): void {
    const frame: InputFrame = {
      timestamp: performance.now(),
      cursor: { ...this.last },
      gesture: this.pressed ? 'pinch' : 'point',
      landmarks: null,
      inferenceMs: null,
    }
    this.listeners.forEach((l) => l(frame))
  }

  private onMove = (e: PointerEvent): void => {
    const r = this.target.getBoundingClientRect()
    this.last = {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    }
    this.emit()
  }

  private onDown = (): void => {
    this.pressed = true
    this.emit()
  }

  private onUp = (): void => {
    this.pressed = false
    this.emit()
  }
}
