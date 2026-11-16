// Copia o runtime WASM do MediaPipe para public/ para ser servido localmente
// (sem depender de CDN). Os arquivos não são versionados (ver .gitignore).
import { cp, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const from = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm')
const to = join(root, 'public', 'mediapipe', 'wasm')

await mkdir(to, { recursive: true })
await cp(from, to, { recursive: true })
console.log('MediaPipe WASM copiado para public/mediapipe/wasm')
