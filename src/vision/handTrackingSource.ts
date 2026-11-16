import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { createGestureClassifier } from './gestures'
import { OneEuroFilter } from './oneEuro'
import {
  LM,
  type InputFrame,
  type InputListener,
  type InputSource,
  type Landmark,
} from './types'

const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

export interface HandTrackingOptions {
  video: HTMLVideoElement
  /** Base URL do runtime WASM servido localmente. */
  wasmBase?: string
  modelUrl?: string
}

/** Espelha o eixo x para que mover a mão à direita mova o cursor à direita (visão de espelho). */
function mirror(lm: Landmark[]): Landmark[] {
  return lm.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z }))
}

export class HandTrackingSource implements InputSource {
  private listeners = new Set<InputListener>()
  private landmarker: HandLandmarker | null = null
  private stream: MediaStream | null = null
  private rafId = 0
  private running = false
  private lastVideoTime = -1
  private readonly fx = new OneEuroFilter({ minCutoff: 1.2, beta: 0.02 })
  private readonly fy = new OneEuroFilter({ minCutoff: 1.2, beta: 0.02 })
  private readonly classifier = createGestureClassifier()

  private readonly opts: HandTrackingOptions

  constructor(opts: HandTrackingOptions) {
    this.opts = opts
  }

  async start(): Promise<void> {
    if (this.running) return
    const {
      video,
      wasmBase = `${import.meta.env.BASE_URL}mediapipe/wasm`,
      modelUrl = MODEL_URL,
    } = this.opts

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false,
    })
    video.srcObject = this.stream
    await video.play()

    const fileset = await FilesetResolver.forVisionTasks(wasmBase)
    const base = { modelAssetPath: modelUrl }
    try {
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { ...base, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numHands: 1,
      })
    } catch {
      // Sem WebGL/GPU: cai para CPU.
      this.landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { ...base, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numHands: 1,
      })
    }

    this.running = true
    this.loop()
  }

  stop(): void {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.opts.video.srcObject = null
    this.landmarker?.close()
    this.landmarker = null
    this.listeners.clear()
  }

  subscribe(listener: InputListener): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  private loop = (): void => {
    if (!this.running) return
    this.rafId = requestAnimationFrame(this.loop)

    const { video } = this.opts
    if (
      !this.landmarker ||
      video.readyState < 2 ||
      video.currentTime === this.lastVideoTime
    )
      return
    this.lastVideoTime = video.currentTime

    const t0 = performance.now()
    const result = this.landmarker.detectForVideo(video, t0)
    const inferenceMs = performance.now() - t0

    const raw = result.landmarks[0]
    let frame: InputFrame
    if (raw) {
      const lm = mirror(raw)
      const tip = lm[LM.INDEX_TIP]
      const t = t0 / 1000
      frame = {
        timestamp: t0,
        cursor: { x: this.fx.filter(tip.x, t), y: this.fy.filter(tip.y, t) },
        gesture: this.classifier.classify(lm),
        landmarks: lm,
        inferenceMs,
      }
    } else {
      this.fx.reset()
      this.fy.reset()
      this.classifier.reset()
      frame = {
        timestamp: t0,
        cursor: null,
        gesture: 'none',
        landmarks: null,
        inferenceMs,
      }
    }
    this.listeners.forEach((l) => l(frame))
  }
}
