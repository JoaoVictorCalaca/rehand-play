import { WORLD_W } from '../../engine/types'
import {
  BUG_SPECS,
  CAKE_X,
  CAKE_Y,
  COIN_HOLD_MS,
  COIN_LIFE_MS,
  COIN_RADIUS,
  STUN_MS,
  type BugKind,
} from './specs'
import type { Bug, BugSmashView, Coin, Popup, Splat } from './state'

/** Texto em unidades do mundo (evita tamanhos de fonte minúsculos em px). */
function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha = 1,
): void {
  ctx.save()
  ctx.translate(x, y)
  const s = size / 100
  ctx.scale(s, s)
  ctx.globalAlpha = alpha
  ctx.font = '700 100px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineWidth = 12
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'
  ctx.strokeText(text, 0, 0)
  ctx.fillStyle = color
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function drawLegs(
  ctx: CanvasRenderingContext2D,
  r: number,
  t: number,
  color: string,
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = r * 0.07
  ctx.lineCap = 'round'
  for (let i = 0; i < 3; i++) {
    const y = (i - 1) * r * 0.45
    const wiggle = Math.sin(t / 70 + i * 2) * r * 0.18
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.moveTo(side * r * 0.3, y)
      ctx.lineTo(side * r * 0.95, y + wiggle)
      ctx.stroke()
    }
  }
}

function drawMosquito(
  ctx: CanvasRenderingContext2D,
  r: number,
  t: number,
): void {
  drawLegs(ctx, r, t, '#2b2b33')
  // asas
  ctx.fillStyle = 'rgba(200, 225, 255, 0.55)'
  const flap = 0.6 + 0.4 * Math.abs(Math.sin(t / 35))
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(
      side * r * 0.55,
      -r * 0.1,
      r * 0.32 * flap,
      r * 0.75,
      side * 0.5,
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  // corpo
  ctx.fillStyle = '#3a3a46'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.1, r * 0.32, r * 0.7, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, -r * 0.7, r * 0.26, 0, Math.PI * 2)
  ctx.fill()
  // probóscide
  ctx.strokeStyle = '#2b2b33'
  ctx.lineWidth = r * 0.06
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.9)
  ctx.lineTo(0, -r * 1.25)
  ctx.stroke()
}

function drawBeetle(
  ctx: CanvasRenderingContext2D,
  r: number,
  t: number,
  shell: string,
  shine: string,
): void {
  drawLegs(ctx, r, t, '#1d2a1f')
  ctx.fillStyle = shell
  ctx.beginPath()
  ctx.ellipse(0, r * 0.1, r * 0.78, r * 0.95, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'
  ctx.lineWidth = r * 0.05
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.8)
  ctx.lineTo(0, r * 1.0)
  ctx.stroke()
  ctx.fillStyle = shine
  ctx.beginPath()
  ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.14, r * 0.38, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#1d2a1f'
  ctx.beginPath()
  ctx.arc(0, -r * 0.95, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

function drawLadybug(
  ctx: CanvasRenderingContext2D,
  r: number,
  t: number,
): void {
  drawLegs(ctx, r, t, '#222')
  ctx.fillStyle = '#e63946'
  ctx.beginPath()
  ctx.arc(0, r * 0.1, r * 0.85, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#222'
  ctx.lineWidth = r * 0.06
  ctx.beginPath()
  ctx.moveTo(0, -r * 0.75)
  ctx.lineTo(0, r * 0.95)
  ctx.stroke()
  ctx.fillStyle = '#222'
  for (const [dx, dy] of [
    [-0.4, -0.2],
    [0.4, -0.2],
    [-0.45, 0.4],
    [0.45, 0.4],
  ]) {
    ctx.beginPath()
    ctx.arc(dx * r, dy * r + r * 0.1, r * 0.14, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, -r * 0.85, r * 0.3, 0, Math.PI * 2)
  ctx.fill()
}

function drawBug(ctx: CanvasRenderingContext2D, bug: Bug, t: number): void {
  const spec = BUG_SPECS[bug.kind]
  const r = spec.radius

  ctx.save()
  ctx.translate(bug.x, bug.y)
  ctx.rotate(bug.heading + Math.PI / 2)
  drawKind(ctx, bug.kind, r, t + bug.id * 37)
  if (bug.stunMs > 0) {
    ctx.globalAlpha = 0.55 * (bug.stunMs / STUN_MS)
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(0, 0, r * 1.1, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()

  // Barra de vida para insetos resistentes que já levaram dano.
  if (spec.hp > 1 && bug.hp < spec.hp) {
    const w = r * 1.8
    const h = 0.012
    const x = bug.x - w / 2
    const y = bug.y - r * 1.5
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#ff6b6b'
    ctx.fillRect(x, y, w * (bug.hp / spec.hp), h)
  }
}

function drawKind(
  ctx: CanvasRenderingContext2D,
  kind: BugKind,
  r: number,
  t: number,
): void {
  switch (kind) {
    case 'mosquito':
      return drawMosquito(ctx, r, t)
    case 'beetle':
      return drawBeetle(ctx, r, t, '#3a7d44', 'rgba(255,255,255,0.35)')
    case 'boss':
      return drawBeetle(ctx, r, t, '#7b3fa0', 'rgba(255,255,255,0.3)')
    case 'ladybug':
      return drawLadybug(ctx, r, t)
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, t: number): void {
  const bob = Math.sin(t / 220 + coin.id) * 0.008
  const spin = Math.abs(Math.cos(t / 300 + coin.id))
  const life = 1 - coin.ageMs / COIN_LIFE_MS
  const blink = life < 0.3 && Math.floor(t / 120) % 2 === 0

  ctx.save()
  ctx.translate(coin.x, coin.y + bob)
  ctx.globalAlpha = blink ? 0.35 : 1

  // halo quando a mão está armada (pronta para fechar)
  if (coin.armed) {
    ctx.fillStyle = 'rgba(127, 224, 160, 0.3)'
    ctx.beginPath()
    ctx.arc(0, 0, COIN_RADIUS * 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#ffc233'
  ctx.strokeStyle = '#b7791f'
  ctx.lineWidth = 0.008
  ctx.beginPath()
  ctx.ellipse(
    0,
    0,
    COIN_RADIUS * Math.max(0.25, spin),
    COIN_RADIUS,
    0,
    0,
    Math.PI * 2,
  )
  ctx.fill()
  ctx.stroke()
  if (spin > 0.5) drawText(ctx, '$', 0, 0, COIN_RADIUS * 1.1, '#8a5a00')

  // anel de progresso do "pegar"
  if (coin.grabMs > 0) {
    ctx.strokeStyle = '#7fe0a0'
    ctx.lineWidth = 0.012
    ctx.beginPath()
    ctx.arc(
      0,
      0,
      COIN_RADIUS * 1.35,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, coin.grabMs / COIN_HOLD_MS),
    )
    ctx.stroke()
  }
  ctx.restore()
}

function drawPicnic(
  ctx: CanvasRenderingContext2D,
  shakeMs: number,
  t: number,
): void {
  const shake = shakeMs > 0 ? Math.sin(t / 25) * 0.012 : 0
  ctx.save()
  ctx.translate(CAKE_X + shake, CAKE_Y)

  // toalha xadrez
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.beginPath()
  ctx.ellipse(0, 0.07, 0.2, 0.06, 0, 0, Math.PI * 2)
  ctx.fill()

  // prato e bolo
  ctx.fillStyle = '#f1f1f1'
  ctx.beginPath()
  ctx.ellipse(0, 0.05, 0.13, 0.03, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#e29578'
  ctx.fillRect(-0.075, -0.04, 0.15, 0.09)
  ctx.fillStyle = '#fff0e0'
  ctx.fillRect(-0.075, -0.05, 0.15, 0.025)
  ctx.fillStyle = '#e63946'
  ctx.beginPath()
  ctx.arc(0, -0.065, 0.018, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawSplat(ctx: CanvasRenderingContext2D, s: Splat): void {
  const k = s.ageMs / 900
  ctx.save()
  ctx.globalAlpha = 0.8 * (1 - k)
  ctx.fillStyle = s.friendly ? '#e63946' : '#9bd35a'
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + s.x * 10
    const d = 0.03 + 0.025 * ((i * 3) % 4) + 0.03 * k
    ctx.beginPath()
    ctx.arc(
      s.x + Math.cos(a) * d,
      s.y + Math.sin(a) * d,
      0.012 + 0.008 * ((i * 5) % 3),
      0,
      Math.PI * 2,
    )
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(s.x, s.y, 0.03, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawPopup(ctx: CanvasRenderingContext2D, p: Popup): void {
  const k = p.ageMs / 900
  drawText(ctx, p.text, p.x, p.y - 0.08 * k - 0.04, 0.05, p.color, 1 - k * k)
}

export function renderBugSmash(
  ctx: CanvasRenderingContext2D,
  view: BugSmashView,
): void {
  ctx.save()
  // Lados do palco: guia visual sutil de onde os insetos entram.
  ctx.fillStyle = 'rgba(255,255,255,0.03)'
  ctx.fillRect(0, 0, WORLD_W, 1)
  ctx.restore()

  drawPicnic(ctx, view.cakeShakeMs, view.elapsed)
  for (const s of view.splats) drawSplat(ctx, s)
  for (const c of view.coins) drawCoin(ctx, c, view.elapsed)
  for (const b of view.bugs) drawBug(ctx, b, view.elapsed)

  // Rastro do tapa
  if (view.slapping && view.trail.length >= 2) {
    const a = view.trail[0]
    const b = view.trail[view.trail.length - 1]
    ctx.save()
    ctx.strokeStyle = 'rgba(255, 190, 90, 0.75)'
    ctx.lineWidth = 0.03
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(a.x, a.y)
    ctx.lineTo(b.x, b.y)
    ctx.stroke()
    ctx.restore()
  }

  for (const p of view.popups) drawPopup(ctx, p)
}
