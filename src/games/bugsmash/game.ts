import { distance, segmentHitsCircle } from '../../engine/collision'
import { mean } from '../../engine/stats'
import {
  WORLD_H,
  WORLD_W,
  type Difficulty,
  type Game,
  type GameInput,
  type Hud,
  type SessionResult,
} from '../../engine/types'
import { renderBugSmash } from './render'
import {
  BUG_SPECS,
  CAKE_REACH,
  CAKE_X,
  CAKE_Y,
  COIN_GRAB_RADIUS,
  COIN_HOLD_MS,
  COIN_LIFE_MS,
  COIN_RADIUS,
  COIN_TOUCH_SLACK,
  COIN_VALUE,
  COINS_PER_LIFE,
  COMBO_WINDOW_MS,
  DIFFICULTY,
  SLAP_SLACK,
  STUN_MS,
  TRAIL_MS,
  comboMultiplier,
  type BugKind,
  type DifficultyConfig,
} from './specs'
import type { Bug, BugSmashView, Coin, Popup, Splat, TrailPoint } from './state'

type Phase = 'break' | 'wave'

const FIRST_BREAK_MS = 1500
const WAVE_BREAK_MS = 2400

function isClosed(g: GameInput['gesture']): boolean {
  return g === 'fist' || g === 'pinch'
}

/**
 * Guardião do Piquenique: insetos avançam para o piquenique. Dê tapas rápidos
 * com a mão aberta para eliminá-los (extensão e amplitude), mas poupe as
 * joaninhas. Quando aparecer uma moeda, aproxime a mão aberta e feche-a para
 * pegar (flexão dos dedos).
 */
export class BugSmashGame implements Game {
  private readonly cfg: DifficultyConfig
  private readonly difficulty: Difficulty
  private readonly rng: () => number

  private bugs: Bug[] = []
  private coins: Coin[] = []
  private splats: Splat[] = []
  private popups: Popup[] = []
  private trail: TrailPoint[] = []

  private elapsed = 0
  private wave = 1
  private phase: Phase = 'break'
  private breakMs = FIRST_BREAK_MS
  private queue: BugKind[] = []
  private spawnTimer = 0
  private coinTimer = 4000

  private lives: number
  private score = 0
  private combo = 0
  private comboMs = 0
  private maxCombo = 0
  private over = false

  private kills = 0
  private escaped = 0
  private friendlySlaps = 0
  private coinsCollected = 0
  private coinsMissed = 0
  private reactions: number[] = []
  private slapSpeeds: number[] = []

  private slapping = false
  private cakeShakeMs = 0
  private nextId = 0

  constructor(difficulty: Difficulty, rng: () => number = Math.random) {
    this.difficulty = difficulty
    this.cfg = DIFFICULTY[difficulty]
    this.rng = rng
    this.lives = this.cfg.lives
  }

  // ---------------------------------------------------------------- update

  update(dtMs: number, input: GameInput): void {
    if (this.over) return
    this.elapsed += dtMs
    this.cakeShakeMs = Math.max(0, this.cakeShakeMs - dtMs)
    this.tickCombo(dtMs)

    const cursor = input.cursor
      ? { x: input.cursor.x * WORLD_W, y: input.cursor.y * WORLD_H }
      : null
    const closed = isClosed(input.gesture)

    this.updateTrail(cursor)
    this.updateWaves(dtMs)
    this.moveBugs(dtMs)
    this.handleSlap(closed)
    this.handleCoins(dtMs, cursor, closed)
    this.updateCoinSpawns(dtMs)
    this.checkWaveClear()
    this.updateEffects(dtMs)

    if (this.lives <= 0) this.over = true
  }

  private tickCombo(dtMs: number): void {
    if (this.combo === 0) return
    this.comboMs -= dtMs
    if (this.comboMs <= 0) this.combo = 0
  }

  // ----------------------------------------------------------------- slap

  private updateTrail(cursor: { x: number; y: number } | null): void {
    if (!cursor) {
      this.trail = []
      return
    }
    const last = this.trail[this.trail.length - 1]
    if (!last || last.x !== cursor.x || last.y !== cursor.y) {
      this.trail.push({ x: cursor.x, y: cursor.y, t: this.elapsed })
    }
    const newest = this.trail[this.trail.length - 1]
    // Descarta pontos antigos, mantendo ao menos o mais recente.
    while (this.trail.length > 1 && newest.t - this.trail[0].t > TRAIL_MS)
      this.trail.shift()
  }

  /** Velocidade do cursor (unidades/s) na janela recente. */
  private cursorSpeed(): number {
    if (this.trail.length < 2) return 0
    const newest = this.trail[this.trail.length - 1]
    if (this.elapsed - newest.t > 100) return 0 // a mão parou
    const oldest = this.trail[0]
    const span = newest.t - oldest.t
    if (span < 30) return 0
    return distance(oldest.x, oldest.y, newest.x, newest.y) / (span / 1000)
  }

  private handleSlap(closed: boolean): void {
    this.slapping = false
    if (closed) return
    const speed = this.cursorSpeed()
    if (speed < this.cfg.slapSpeed) return
    this.slapping = true

    const a = this.trail[0]
    const b = this.trail[this.trail.length - 1]
    const len = distance(a.x, a.y, b.x, b.y) || 1
    const dirX = (b.x - a.x) / len
    const dirY = (b.y - a.y) / len

    for (const bug of this.bugs) {
      if (bug.dead || bug.stunMs > 0) continue
      const spec = BUG_SPECS[bug.kind]
      if (
        segmentHitsCircle(
          a.x,
          a.y,
          b.x,
          b.y,
          bug.x,
          bug.y,
          spec.radius + SLAP_SLACK,
        )
      ) {
        this.hitBug(bug, speed, dirX, dirY)
      }
    }
    this.bugs = this.bugs.filter((b) => !b.dead)
  }

  private hitBug(bug: Bug, speed: number, dirX: number, dirY: number): void {
    const spec = BUG_SPECS[bug.kind]

    if (spec.friendly) {
      bug.dead = true
      this.lives--
      this.friendlySlaps++
      this.combo = 0
      this.splats.push({ x: bug.x, y: bug.y, ageMs: 0, friendly: true })
      this.popup(bug.x, bug.y, '−1 vida', '#ff6b6b')
      return
    }

    bug.hp--
    this.slapSpeeds.push(speed)
    if (bug.hp > 0) {
      bug.stunMs = STUN_MS
      bug.x += dirX * 0.05
      bug.y += dirY * 0.05
      this.popup(bug.x, bug.y, 'Pow!', '#ffd166')
      return
    }

    bug.dead = true
    this.kills++
    this.combo++
    this.comboMs = COMBO_WINDOW_MS
    this.maxCombo = Math.max(this.maxCombo, this.combo)
    const points = Math.round(spec.points * comboMultiplier(this.combo))
    this.score += points
    this.reactions.push(bug.ageMs)
    this.splats.push({ x: bug.x, y: bug.y, ageMs: 0, friendly: false })
    this.popup(bug.x, bug.y, `+${points}`, '#ffe66d')
    if (this.rng() < spec.coinChance) this.spawnCoin(bug.x, bug.y)
  }

  // ---------------------------------------------------------------- coins

  private handleCoins(
    dtMs: number,
    cursor: { x: number; y: number } | null,
    closed: boolean,
  ): void {
    for (const coin of this.coins) {
      coin.ageMs += dtMs
      const d = cursor ? distance(cursor.x, cursor.y, coin.x, coin.y) : Infinity
      const touching = d <= COIN_RADIUS + COIN_TOUCH_SLACK
      const near = d <= COIN_GRAB_RADIUS

      if (!near) coin.armed = false
      else if (touching && !closed) coin.armed = true

      if (near && closed && coin.armed) {
        coin.grabMs += dtMs
        if (coin.grabMs >= COIN_HOLD_MS) this.collectCoin(coin)
      } else {
        coin.grabMs = Math.max(0, coin.grabMs - dtMs)
      }

      if (!coin.taken && coin.ageMs >= COIN_LIFE_MS) {
        coin.taken = true
        this.coinsMissed++
      }
    }
    this.coins = this.coins.filter((c) => !c.taken)
  }

  private collectCoin(coin: Coin): void {
    coin.taken = true
    this.coinsCollected++
    this.score += COIN_VALUE
    this.reactions.push(coin.ageMs)
    this.popup(coin.x, coin.y, `+${COIN_VALUE}`, '#ffd166')
    if (
      this.coinsCollected % COINS_PER_LIFE === 0 &&
      this.lives < this.cfg.lives
    ) {
      this.lives++
      this.popup(coin.x, coin.y - 0.08, '+1 vida', '#7fe0a0')
    }
  }

  private updateCoinSpawns(dtMs: number): void {
    this.coinTimer -= dtMs
    if (this.coinTimer > 0) return
    this.coinTimer = 5000 + this.rng() * 3000
    if (this.coins.length >= 3) return
    this.spawnCoin(
      0.12 + this.rng() * (WORLD_W - 0.24),
      0.15 + this.rng() * 0.55,
    )
  }

  /** Cria uma moeda (usado pelo jogo e pelos testes). */
  spawnCoin(x: number, y: number): void {
    const cx = Math.min(WORLD_W - 0.1, Math.max(0.1, x))
    const cy = Math.min(0.75, Math.max(0.1, y))
    this.coins.push({
      id: this.nextId++,
      x: cx,
      y: cy,
      ageMs: 0,
      armed: false,
      grabMs: 0,
      taken: false,
    })
  }

  // ---------------------------------------------------------------- waves

  private updateWaves(dtMs: number): void {
    if (this.phase === 'break') {
      this.breakMs -= dtMs
      if (this.breakMs <= 0) this.startWave()
      return
    }
    if (this.queue.length === 0) return
    this.spawnTimer -= dtMs
    if (this.spawnTimer <= 0) {
      const kind = this.queue.shift()!
      this.spawnBug(kind)
      this.spawnTimer = this.spawnInterval() * (0.7 + this.rng() * 0.6)
    }
  }

  private spawnInterval(): number {
    return Math.max(450, 1500 - 90 * this.wave) * this.cfg.spawnMul
  }

  private startWave(): void {
    this.phase = 'wave'
    this.queue = this.buildQueue(this.wave)
    this.spawnTimer = 0
  }

  private buildQueue(wave: number): BugKind[] {
    const count = Math.min(40, 5 + 2 * wave)
    const beetleShare = Math.min(0.4, 0.08 * (wave - 1))
    const queue: BugKind[] = []
    for (let i = 0; i < count; i++) {
      const r = this.rng()
      if (wave >= 2 && r < 0.12) queue.push('ladybug')
      else if (wave >= 2 && r < 0.12 + beetleShare) queue.push('beetle')
      else queue.push('mosquito')
    }
    if (wave % 5 === 0) queue.unshift('boss')
    return queue
  }

  private checkWaveClear(): void {
    if (this.phase !== 'wave' || this.queue.length > 0 || this.bugs.length > 0)
      return
    const bonus = 200 * this.wave
    this.score += bonus
    this.popup(
      WORLD_W / 2,
      0.4,
      `Onda ${this.wave} concluída! +${bonus}`,
      '#7fe0a0',
    )
    this.wave++
    this.phase = 'break'
    this.breakMs = WAVE_BREAK_MS
  }

  /** Cria um inseto; sem posição, nasce numa borda aleatória (usado pelo jogo e pelos testes). */
  spawnBug(kind: BugKind, x?: number, y?: number): void {
    let px = x
    let py = y
    if (px === undefined || py === undefined) {
      const edge = this.rng()
      if (edge < 0.5) {
        px = 0.1 + this.rng() * (WORLD_W - 0.2)
        py = -0.05
      } else if (edge < 0.75) {
        px = -0.05
        py = this.rng() * 0.5
      } else {
        px = WORLD_W + 0.05
        py = this.rng() * 0.5
      }
    }
    this.bugs.push({
      id: this.nextId++,
      kind,
      x: px,
      y: py,
      hp: BUG_SPECS[kind].hp,
      ageMs: 0,
      heading: Math.atan2(CAKE_Y - py, CAKE_X - px),
      wobblePhase: this.rng() * Math.PI * 2,
      stunMs: 0,
      dead: false,
    })
  }

  private moveBugs(dtMs: number): void {
    const speedBoost = 1 + 0.06 * (this.wave - 1)
    const dt = dtMs / 1000

    for (const bug of this.bugs) {
      bug.ageMs += dtMs
      if (bug.stunMs > 0) {
        bug.stunMs -= dtMs
        continue
      }
      const spec = BUG_SPECS[bug.kind]
      const toCake = Math.atan2(CAKE_Y - bug.y, CAKE_X - bug.x)
      const lateral = Math.cos(bug.ageMs / 350 + bug.wobblePhase) * 0.5
      const vx = Math.cos(toCake) - Math.sin(toCake) * lateral
      const vy = Math.sin(toCake) + Math.cos(toCake) * lateral
      const v = spec.speed * this.cfg.speedMul * speedBoost
      bug.x += vx * v * dt
      bug.y += vy * v * dt
      bug.heading = Math.atan2(vy, vx)

      if (distance(bug.x, bug.y, CAKE_X, CAKE_Y) < CAKE_REACH) {
        bug.dead = true
        if (!spec.friendly) {
          this.lives--
          this.escaped++
          this.combo = 0
          this.cakeShakeMs = 400
          this.popup(CAKE_X, CAKE_Y - 0.12, '−1 vida', '#ff6b6b')
        }
      }
    }
    this.bugs = this.bugs.filter((b) => !b.dead)
  }

  // ------------------------------------------------------------- effects

  private popup(x: number, y: number, text: string, color: string): void {
    this.popups.push({ x, y, text, color, ageMs: 0 })
  }

  private updateEffects(dtMs: number): void {
    for (const s of this.splats) s.ageMs += dtMs
    for (const p of this.popups) p.ageMs += dtMs
    this.splats = this.splats.filter((s) => s.ageMs < 900)
    this.popups = this.popups.filter((p) => p.ageMs < 900)
  }

  // ---------------------------------------------------------------- Game

  get view(): BugSmashView {
    return {
      bugs: this.bugs,
      coins: this.coins,
      splats: this.splats,
      popups: this.popups,
      trail: this.trail,
      slapping: this.slapping,
      cakeShakeMs: this.cakeShakeMs,
      elapsed: this.elapsed,
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    renderBugSmash(ctx, this.view)
  }

  hud(): Hud {
    let hint: string
    if (this.coins.length > 0)
      hint = 'Moeda! Mão aberta sobre ela e feche para pegar'
    else if (this.phase === 'break')
      hint = `Onda ${this.wave}${this.wave % 5 === 0 ? ' · Chefão!' : ''}`
    else hint = 'Tapa rápido nos insetos. Poupe as joaninhas!'
    return {
      score: this.score,
      lives: Math.max(0, this.lives),
      maxLives: this.cfg.lives,
      wave: this.wave,
      combo: this.combo,
      multiplier: comboMultiplier(this.combo),
      hint,
    }
  }

  isFinished(): boolean {
    return this.over
  }

  result(): SessionResult {
    const wins = this.kills + this.coinsCollected
    const fails = this.escaped + this.coinsMissed
    return {
      difficulty: this.difficulty,
      durationMs: this.elapsed,
      score: this.score,
      wave: this.wave,
      bugsKilled: this.kills,
      bugsEscaped: this.escaped,
      friendlySlaps: this.friendlySlaps,
      coinsCollected: this.coinsCollected,
      coinsMissed: this.coinsMissed,
      maxCombo: this.maxCombo,
      accuracy:
        wins + fails === 0
          ? 0
          : Math.round((wins / (wins + fails)) * 1000) / 10,
      avgReactionMs: mean(this.reactions),
      avgSlapSpeed: mean(this.slapSpeeds),
      playedAt: Date.now(),
    }
  }
}
