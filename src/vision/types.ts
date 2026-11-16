/** Ponto normalizado (0–1) no referencial da imagem. */
export interface Landmark {
  x: number
  y: number
  z: number
}

export type Gesture = 'none' | 'open' | 'fist' | 'pinch' | 'point'

export interface Point {
  x: number
  y: number
}

/** Um instante de entrada do jogador, independente da origem (dedo ou mouse). */
export interface InputFrame {
  /** performance.now() em ms */
  timestamp: number
  /** Cursor normalizado (0–1) já espelhado e suavizado; null se não há mão. */
  cursor: Point | null
  gesture: Gesture
  /** 21 pontos da mão (espelhados); null para fontes sem landmarks. */
  landmarks: Landmark[] | null
  /** Tempo da inferência em ms (só para a webcam). */
  inferenceMs: number | null
}

export type InputListener = (frame: InputFrame) => void

/**
 * Contrato único consumido pelo motor do jogo. O motor não conhece a
 * câmera nem o MediaPipe, só esta interface.
 */
export interface InputSource {
  start(): Promise<void>
  stop(): void
  subscribe(listener: InputListener): () => void
}

/** Índices dos landmarks da mão no MediaPipe. */
export const LM = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_TIP: 20,
} as const

export const HAND_CONNECTIONS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
]
