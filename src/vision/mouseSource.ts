import type { InputFrame, InputListener, InputSource } from './types'

/**
 * Fallback: o mouse vira o cursor; segurar o botão equivale a "fechar a mão"
 * (punho) e soltar equivale a "mão aberta". Permite jogar sem webcam.
 *
 * O alvo é resolvido a cada evento, então a fonte pode ser criada antes de o
 * palco (stage) existir na tela.
 */
export class MouseInputSource implements InputSource {
  private listeners = new Set<InputListener>()
  private pressed = false
  private last = { x: 0.5, y: 0.5 }
  private active = false
  private readonly getTarget: () => HTMLElement | null

  constructor(getTarget: () => HTMLElement | null) {
    this.getTarget = getTarget
  }

  async start(): Promise<void> {
    if (this.active) return
    this.active = true
    window.addEventListener('pointermove', this.onMove)
    window.addEventListener('pointerdown', this.onDown)
    window.addEventListener('pointerup', this.onUp)
  }

  stop(): void {
    this.active = false
    window.removeEventListener('pointermove', this.onMove)
    window.removeEventListener('pointerdown', this.onDown)
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
      gesture: this.pressed ? 'fist' : 'open',
      landmarks: null,
      inferenceMs: null,
    }
    this.listeners.forEach((l) => l(frame))
  }

  private onMove = (e: PointerEvent): void => {
    const target = this.getTarget()
    if (!target) return
    const r = target.getBoundingClientRect()
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
