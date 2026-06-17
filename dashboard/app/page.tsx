'use client'

import { useEffect, useRef, useState } from 'react'
import { getStats } from '../lib/api'

interface Stats {
  total_events: number
  high_risk_events: number
  unique_countries: string[]
}

export default function DecoyShieldLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const [stats, setStats] = useState<Stats | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const animRef = useRef<number>(0)

  useEffect(() => {
    getStats().then(setStats)
    const iv = setInterval(() => getStats().then(setStats), 30000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  const canvas = canvasRef.current
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  const handleResize = () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  window.addEventListener('resize', handleResize)

  const particles: {
    x: number; y: number; vx: number; vy: number
    r: number; a: number; color: string
  }[] = []

  const colors = ['#7c3aed', '#a855f7', '#ec4899', '#06ffa5', '#38bdf8']
  for (let i = 0; i < 120; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      a: Math.random() * 0.6 + 0.1,
      color: colors[Math.floor(Math.random() * colors.length)],
    })
  }

  function drawHexGrid(c: CanvasRenderingContext2D, W: number, H: number) {
    const size = 32, h = size * Math.sqrt(3)
    c.strokeStyle = 'rgba(124,58,237,0.05)'
    c.lineWidth = 0.5
    for (let row = -1; row < H / h + 2; row++) {
      for (let col = -1; col < W / (size * 1.5) + 2; col++) {
        const x = col * size * 1.5
        const y = row * h + (col % 2 === 0 ? 0 : h / 2)
        c.beginPath()
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 180) * (60 * i - 30)
          i === 0
            ? c.moveTo(x + size * Math.cos(a), y + size * Math.sin(a))
            : c.lineTo(x + size * Math.cos(a), y + size * Math.sin(a))
        }
        c.closePath()
        c.stroke()
      }
    }
  }

  function drawRoboticFace(c: CanvasRenderingContext2D, mx: number, my: number, t: number, W: number, H: number) {
    const cx = W * 0.72
    const cy = H * 0.48
    const scale = Math.min(W, H) * 0.3

    const tiltX = (mx / W - 0.5) * 0.08
    const tiltY = (my / H - 0.5) * 0.06

    c.save()
    c.translate(cx, cy)
    c.rotate(tiltX)
    c.translate(-cx, -cy)

    // Glow aura
    const aura = c.createRadialGradient(cx, cy, 0, cx, cy, scale * 0.9)
    aura.addColorStop(0, 'rgba(124,58,237,0.08)')
    aura.addColorStop(1, 'transparent')
    c.fillStyle = aura
    c.beginPath()
    c.arc(cx, cy, scale * 0.9, 0, Math.PI * 2)
    c.fill()

    // Robotic head — hard geometric panels
    const panels = [
      // Forehead
      { x: cx - scale * 0.32, y: cy - scale * 0.52, w: scale * 0.64, h: scale * 0.18, color: 'rgba(124,58,237,0.12)', stroke: 'rgba(124,58,237,0.5)' },
      // Left cheek
      { x: cx - scale * 0.38, y: cy - scale * 0.3, w: scale * 0.18, h: scale * 0.38, color: 'rgba(56,189,248,0.06)', stroke: 'rgba(56,189,248,0.3)' },
      // Right cheek
      { x: cx + scale * 0.2, y: cy - scale * 0.3, w: scale * 0.18, h: scale * 0.38, color: 'rgba(56,189,248,0.06)', stroke: 'rgba(56,189,248,0.3)' },
      // Chin
      { x: cx - scale * 0.24, y: cy + scale * 0.3, w: scale * 0.48, h: scale * 0.2, color: 'rgba(167,139,250,0.08)', stroke: 'rgba(167,139,250,0.3)' },
      // Nose panel
      { x: cx - scale * 0.07, y: cy - scale * 0.06, w: scale * 0.14, h: scale * 0.22, color: 'rgba(6,255,165,0.05)', stroke: 'rgba(6,255,165,0.25)' },
    ]

    panels.forEach(p => {
      c.beginPath()
      c.rect(p.x + tiltX * scale * 0.2, p.y + tiltY * scale * 0.15, p.w, p.h)
      c.fillStyle = p.color
      c.fill()
      c.strokeStyle = p.stroke
      c.lineWidth = 0.5
      c.stroke()
    })

    // Head outline — octagonal robotic shape
    const headPts = [
      [cx - scale * 0.22, cy - scale * 0.55],
      [cx + scale * 0.22, cy - scale * 0.55],
      [cx + scale * 0.4, cy - scale * 0.35],
      [cx + scale * 0.4, cy + scale * 0.25],
      [cx + scale * 0.22, cy + scale * 0.52],
      [cx - scale * 0.22, cy + scale * 0.52],
      [cx - scale * 0.4, cy + scale * 0.25],
      [cx - scale * 0.4, cy - scale * 0.35],
    ].map(([x, y]) => [x! + tiltX * scale * 0.25, y! + tiltY * scale * 0.2])

    c.beginPath()
    headPts.forEach(([x, y], i) => i === 0 ? c.moveTo(x!, y!) : c.lineTo(x!, y!))
    c.closePath()
    c.strokeStyle = 'rgba(124,58,237,0.6)'
    c.lineWidth = 1
    c.stroke()
    c.fillStyle = 'rgba(5,5,5,0.4)'
    c.fill()

    // Inner face frame
    c.beginPath()
    const innerScale = 0.85
    headPts.forEach(([x, y], i) => {
      const ix = cx + (x! - cx) * innerScale
      const iy = cy + (y! - cy) * innerScale
      i === 0 ? c.moveTo(ix, iy) : c.lineTo(ix, iy)
    })
    c.closePath()
    c.strokeStyle = 'rgba(124,58,237,0.2)'
    c.lineWidth = 0.5
    c.stroke()

    // Grid lines on face
    const rows = 12, cols = 10
    for (let r = 0; r < rows; r++) {
      for (let col2 = 0; col2 < cols; col2++) {
        const u = (col2 / (cols - 1)) * 2 - 1
        const v = (r / (rows - 1)) * 2 - 1
        const px = cx + u * scale * 0.36 + tiltX * scale * 0.2
        const py = cy + v * scale * 0.5 + tiltY * scale * 0.15
        if (col2 < cols - 1) {
          const nx = cx + ((col2 + 1) / (cols - 1)) * 2 * scale * 0.36 - scale * 0.36 + tiltX * scale * 0.2
          c.beginPath()
          c.moveTo(px, py)
          c.lineTo(nx, py)
          c.strokeStyle = 'rgba(124,58,237,0.1)'
          c.lineWidth = 0.3
          c.stroke()
        }
        if (r < rows - 1) {
          const ny = cy + ((r + 1) / (rows - 1)) * 2 * scale * 0.5 - scale * 0.5 + tiltY * scale * 0.15
          c.beginPath()
          c.moveTo(px, py)
          c.lineTo(px, ny)
          c.strokeStyle = 'rgba(124,58,237,0.1)'
          c.lineWidth = 0.3
          c.stroke()
        }
      }
    }

    // Robotic eyes — hexagonal
    const eyePulse = Math.sin(t * 0.03) * 0.3 + 0.7
    const blinkState = Math.sin(t * 0.008) > 0.95 ? Math.max(0, 1 - (Math.sin(t * 0.008) - 0.95) * 20) : 1
    const eyePositions = [
      { x: cx - scale * 0.2 + tiltX * scale * 0.15, y: cy - scale * 0.14 + tiltY * scale * 0.1 },
      { x: cx + scale * 0.2 + tiltX * scale * 0.15, y: cy - scale * 0.14 + tiltY * scale * 0.1 },
    ]

    eyePositions.forEach(eye => {
      const er = scale * 0.072

      // Eye glow
      const eg = c.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, er * 2.5)
      eg.addColorStop(0, `rgba(56,189,248,${0.4 * eyePulse})`)
      eg.addColorStop(1, 'transparent')
      c.fillStyle = eg
      c.beginPath()
      c.arc(eye.x, eye.y, er * 2.5, 0, Math.PI * 2)
      c.fill()

      // Eye socket — hexagonal
      c.save()
      c.translate(eye.x, eye.y)
      c.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i
        i === 0
          ? c.moveTo(er * Math.cos(a), er * blinkState * Math.sin(a))
          : c.lineTo(er * Math.cos(a), er * blinkState * Math.sin(a))
      }
      c.closePath()
      c.fillStyle = 'rgba(5,5,20,0.9)'
      c.fill()
      c.strokeStyle = `rgba(56,189,248,${0.8 * eyePulse})`
      c.lineWidth = 1
      c.stroke()

      // Inner iris ring
      c.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i + Math.PI / 6
        i === 0
          ? c.moveTo(er * 0.55 * Math.cos(a), er * 0.55 * blinkState * Math.sin(a))
          : c.lineTo(er * 0.55 * Math.cos(a), er * 0.55 * blinkState * Math.sin(a))
      }
      c.closePath()
      c.strokeStyle = `rgba(56,189,248,${0.5 * eyePulse})`
      c.lineWidth = 0.5
      c.stroke()

      // Pupil
      c.beginPath()
      c.arc(0, 0, er * 0.2, 0, Math.PI * 2)
      c.fillStyle = `rgba(56,189,248,${eyePulse})`
      c.fill()

      // Scan line through eye
      c.beginPath()
      c.moveTo(-er * 1.2, 0)
      c.lineTo(er * 1.2, 0)
      c.strokeStyle = `rgba(56,189,248,${0.5 * eyePulse})`
      c.lineWidth = 0.5
      c.stroke()

      c.restore()

      // Circuit lines from eyes
      c.beginPath()
      c.moveTo(eye.x + er, eye.y)
      c.lineTo(eye.x + er * 2.5, eye.y)
      c.lineTo(eye.x + er * 2.5, eye.y - er)
      c.strokeStyle = `rgba(56,189,248,${0.3 * eyePulse})`
      c.lineWidth = 0.5
      c.stroke()
    })

    // Mouth — robotic speaker grille
    const mouthY = cy + scale * 0.3 + tiltY * scale * 0.15
    const mouthX = cx + tiltX * scale * 0.2
    const mouthW = scale * 0.32
    const mouthH = scale * 0.06
    const speakerLines = 6

    c.beginPath()
    c.rect(mouthX - mouthW / 2, mouthY - mouthH / 2, mouthW, mouthH)
    c.strokeStyle = 'rgba(236,72,153,0.5)'
    c.lineWidth = 0.5
    c.stroke()
    c.fillStyle = 'rgba(5,5,5,0.8)'
    c.fill()

    for (let i = 0; i < speakerLines; i++) {
      const lx = mouthX - mouthW / 2 + (mouthW / (speakerLines + 1)) * (i + 1)
      c.beginPath()
      c.moveTo(lx, mouthY - mouthH / 2 + 2)
      c.lineTo(lx, mouthY + mouthH / 2 - 2)
      c.strokeStyle = `rgba(236,72,153,${0.3 + Math.sin(t * 0.1 + i) * 0.2})`
      c.lineWidth = 1.5
      c.stroke()
    }

    // Nose bridge — angular
    const noseX = cx + tiltX * scale * 0.15
    const noseTopY = cy - scale * 0.04 + tiltY * scale * 0.1
    const noseBotY = cy + scale * 0.18 + tiltY * scale * 0.1
    c.beginPath()
    c.moveTo(noseX - scale * 0.04, noseTopY)
    c.lineTo(noseX, noseTopY - scale * 0.04)
    c.lineTo(noseX + scale * 0.04, noseTopY)
    c.lineTo(noseX + scale * 0.04, noseBotY)
    c.lineTo(noseX - scale * 0.04, noseBotY)
    c.closePath()
    c.strokeStyle = 'rgba(167,139,250,0.4)'
    c.lineWidth = 0.5
    c.stroke()

    // Status indicators on forehead
    const foreheadY = cy - scale * 0.46 + tiltY * scale * 0.1
    for (let i = 0; i < 5; i++) {
      const lx = cx - scale * 0.16 + i * scale * 0.08 + tiltX * scale * 0.15
      const on = Math.sin(t * 0.05 + i * 1.2) > 0.3
      c.beginPath()
      c.arc(lx, foreheadY, scale * 0.012, 0, Math.PI * 2)
      c.fillStyle = on ? `rgba(6,255,165,${0.8})` : 'rgba(6,255,165,0.15)'
      c.fill()
    }

    // Circuit traces on cheeks
    const traces = [
      { x1: cx - scale * 0.38, y1: cy, x2: cx - scale * 0.52, y2: cy, x3: cx - scale * 0.52, y3: cy - scale * 0.12 },
      { x1: cx + scale * 0.38, y1: cy, x2: cx + scale * 0.52, y2: cy, x3: cx + scale * 0.52, y3: cy - scale * 0.12 },
    ]
    traces.forEach(tr => {
      c.beginPath()
      c.moveTo(tr.x1 + tiltX * scale * 0.2, tr.y1 + tiltY * scale * 0.15)
      c.lineTo(tr.x2 + tiltX * scale * 0.2, tr.y2 + tiltY * scale * 0.15)
      c.lineTo(tr.x3 + tiltX * scale * 0.2, tr.y3 + tiltY * scale * 0.15)
      c.strokeStyle = 'rgba(56,189,248,0.25)'
      c.lineWidth = 0.5
      c.stroke()
      c.beginPath()
      c.arc(tr.x3 + tiltX * scale * 0.2, tr.y3 + tiltY * scale * 0.15, 2, 0, Math.PI * 2)
      c.fillStyle = 'rgba(56,189,248,0.5)'
      c.fill()
    })

    // Scanning line across face
    const scanY = cy - scale * 0.55 + ((t * 1.5) % (scale * 1.1))
    const scanGrad = c.createLinearGradient(cx - scale * 0.42, scanY, cx + scale * 0.42, scanY)
    scanGrad.addColorStop(0, 'transparent')
    scanGrad.addColorStop(0.5, 'rgba(6,255,165,0.2)')
    scanGrad.addColorStop(1, 'transparent')
    c.fillStyle = scanGrad
    c.fillRect(cx - scale * 0.42, scanY - 1, scale * 0.84, 2)

    // Left fade gradient to blend into page
    const leftFade = c.createLinearGradient(cx - scale * 1.2, 0, cx - scale * 0.38, 0)
    leftFade.addColorStop(0, 'rgba(5,5,5,1)')
    leftFade.addColorStop(1, 'transparent')
    c.fillStyle = leftFade
    c.fillRect(0, 0, cx - scale * 0.38, H)

    // Bottom fade
    const botFade = c.createLinearGradient(0, H - scale * 0.6, 0, H)
    botFade.addColorStop(0, 'transparent')
    botFade.addColorStop(1, 'rgba(5,5,5,1)')
    c.fillStyle = botFade
    c.fillRect(0, H - scale * 0.6, W, scale * 0.6)

    c.restore()
  }

  const trail: { x: number; y: number; a: number }[] = []
  let t = 0

  function animate() {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = 'rgba(5,5,5,0.18)'
    ctx.fillRect(0, 0, W, H)

    drawHexGrid(ctx, W, H)

    // Mouse trail
    trail.push({ x: mouseRef.current.x, y: mouseRef.current.y, a: 0.8 })
    if (trail.length > 24) trail.shift()
    trail.forEach((pt, i) => {
      pt.a *= 0.88
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, (i / trail.length) * 6 + 1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(124,58,237,${pt.a * 0.5})`
      ctx.fill()
    })

    // Mouse ripple
    const rippleR = (t * 3) % 60
    ctx.beginPath()
    ctx.arc(mouseRef.current.x, mouseRef.current.y, rippleR, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(124,58,237,${0.3 * (1 - rippleR / 60)})`
    ctx.lineWidth = 0.5
    ctx.stroke()

    // Particles
    particles.forEach((p, i) => {
      p.x += p.vx
      p.y += p.vy
      if (p.x < 0 || p.x > W) p.vx *= -1
      if (p.y < 0 || p.y > H) p.vy *= -1

      const dx = p.x - mouseRef.current.x
      const dy = p.y - mouseRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 120) {
        p.vx += (dx / dist) * 0.3
        p.vy += (dy / dist) * 0.3
      }
      p.vx *= 0.99
      p.vy *= 0.99

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
      ctx.fillStyle = p.color + Math.floor(p.a * 255).toString(16).padStart(2, '0')
      ctx.fill()

      for (let j = i + 1; j < particles.length; j++) {
        const dx2 = p.x - particles[j].x
        const dy2 = p.y - particles[j].y
        const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
        if (d2 < 80) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(particles[j].x, particles[j].y)
          ctx.strokeStyle = `rgba(124,58,237,${(1 - d2 / 80) * 0.12})`
          ctx.lineWidth = 0.3
          ctx.stroke()
        }
      }
    })

    drawRoboticFace(ctx, mouseRef.current.x, mouseRef.current.y, t, W, H)

    t++
    animRef.current = requestAnimationFrame(animate)
  }

  animate()

  return () => {
    cancelAnimationFrame(animRef.current)
    window.removeEventListener('resize', handleResize)
  }

  const parallaxX = typeof window !== 'undefined' ? (mousePos.x / window.innerWidth - 0.5) * 24 : 0
  const parallaxY = typeof window !== 'undefined' ? (mousePos.y / window.innerHeight - 0.5) * 24 : 0

  return (
    <div style={{ minHeight: '100vh', background: '#050505', color: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        .fade1{animation:fadeUp 0.8s ease 0.1s both}
        .fade2{animation:fadeUp 0.8s ease 0.25s both}
        .fade3{animation:fadeUp 0.8s ease 0.4s both}
        .fade4{animation:fadeUp 0.8s ease 0.55s both}
        .fade5{animation:fadeUp 0.8s ease 0.7s both}
        .hcard{transition:all 0.3s ease;cursor:pointer}
        .hcard:hover{transform:translateY(-6px);background:rgba(124,58,237,0.1)!important;border-color:rgba(124,58,237,0.35)!important}
        .nav-link{position:relative;transition:color 0.2s}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#a78bfa;transition:width 0.3s}
        .nav-link:hover{color:#e2e8f0!important}
        .nav-link:hover::after{width:100%}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#050505}
        ::-webkit-scrollbar-thumb{background:#7c3aed40;border-radius:4px}
      `}</style>

      {/* Canvas */}
      <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

      {/* Nav */}
      <nav style={{ position: 'fixed', width: '100%', zIndex: 50, padding: '22px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,5,0.75)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#1a0a2e" stroke="#7c3aed" strokeWidth="1.5" />
            <polygon points="18,7 28,13 28,23 18,29 8,23 8,13" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
            <path d="M18 11 L22 15 L18 13 L14 15 Z" fill="#c8b8ff" />
            <path d="M14 15 L18 13 L22 15 L22 21 L18 25 L14 21 Z" fill="none" stroke="#c8b8ff" strokeWidth="0.8" />
            <circle cx="18" cy="18" r="2" fill="#7c3aed" />
            <circle cx="18" cy="18" r="1" fill="#c8b8ff" />
          </svg>
          <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px', color: '#c8b8ff' }}>DECOYSHIELD</span>
        </div>
        <div style={{ display: 'flex', gap: '32px', fontSize: '13px', color: '#6b7280' }}>
          {['Platform', 'Honeypots', 'Intelligence', 'Pricing'].map(item => (
            <a key={item} href="#" className="nav-link" style={{ color: '#6b7280', textDecoration: 'none' }}>{item}</a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#06ffa5', background: 'rgba(6,255,165,0.08)', border: '0.5px solid rgba(6,255,165,0.2)', borderRadius: '20px', padding: '5px 12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06ffa5', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            LIVE
          </div>
          <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '30px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.5px' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            Deploy Now
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', padding: '0 48px', paddingTop: '80px' }}>
        <div style={{ maxWidth: '560px', transform: `translate(${parallaxX * 0.3}px, ${parallaxY * 0.3}px)`, transition: 'transform 0.1s ease' }}>

          <div className="fade1">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#a78bfa', letterSpacing: '3px', fontWeight: 600, marginBottom: '28px', background: 'rgba(124,58,237,0.1)', border: '0.5px solid rgba(124,58,237,0.25)', borderRadius: '20px', padding: '6px 14px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a78bfa', display: 'inline-block' }} />
              CYBER DECEPTION PLATFORM
            </div>
          </div>

          <div className="fade2">
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '4px', color: '#374151', textTransform: 'uppercase', marginBottom: '16px' }}>You are the predator.</div>
            <h1 style={{ fontSize: 'clamp(52px, 7vw, 88px)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-3px', marginBottom: '28px' }}>
              <span style={{ background: 'linear-gradient(135deg, #ffffff, #c8b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>DECOY</span>
              <br />
              <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(124,58,237,0.5)' }}>SHIELD</span>
            </h1>
          </div>

          <div className="fade3">
            <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '40px', maxWidth: '420px' }}>
              Deploy invisible traps. Every attacker that touches a decoy is caught, profiled, and alerted — before they reach anything real.
            </p>
          </div>

          <div className="fade4" style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '60px' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', color: 'black', border: 'none', borderRadius: '40px', padding: '16px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = '#f0e8ff' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'white' }}>
              Start Trapping
              <span style={{ background: 'black', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>→</span>
            </button>
            <button style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '40px', padding: '16px 32px', fontSize: '14px', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.5)'; e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#9ca3af' }}>
              View Dashboard
            </button>
          </div>

          <div className="fade5" style={{ display: 'flex', gap: '40px' }}>
            {[
              { label: 'Threats Caught', value: stats?.total_events ?? 0, color: '#a78bfa' },
              { label: 'High Risk', value: stats?.high_risk_events ?? 0, color: '#ff4d6d' },
              { label: 'Nations', value: stats?.unique_countries?.length ?? 0, color: '#38bdf8' },
            ].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '36px', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: '#374151', letterSpacing: '1.5px', marginTop: '4px' }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* About */}
      <section style={{ position: 'relative', zIndex: 10, padding: '120px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: 'clamp(80px, 14vw, 160px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-4px', background: 'linear-gradient(180deg, #1a1a2e 0%, transparent 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', userSelect: 'none' }}>ABOUT</h2>
        </div>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '20px' }}>WHAT IS DECOYSHIELD</div>
          <h3 style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.3, marginBottom: '20px', color: '#e2e8f0' }}>Deception is your strongest defense against attackers who never expect it.</h3>
          <p style={{ color: '#4b5563', lineHeight: 1.9, marginBottom: '20px', fontSize: '15px' }}>DecoyShield deploys fake SSH servers, fake admin portals, fake APIs, and fake credentials. When an attacker touches any decoy — we capture everything. Their IP, location, commands, behavior, and tools.</p>
          <p style={{ color: '#374151', lineHeight: 1.9, fontSize: '15px', marginBottom: '32px' }}>Nobody should ever touch a honeypot. If they do, it matters. And you'll know the moment it happens.</p>
          <button style={{ padding: '14px 32px', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '40px', background: 'transparent', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#c8b8ff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9ca3af' }}>
            Learn More →
          </button>
        </div>
      </section>

      {/* Honeypot cards */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 48px 120px' }}>
        <div style={{ marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '16px' }}>DECEPTION ARSENAL</div>
          <h2 style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', background: 'linear-gradient(135deg, #fff, #c8b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every trap. Every vector.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
          {[
            { icon: '⬡', title: 'SSH Honeypot', desc: 'Fake server. Captures brute force, commands, and payloads.', color: '#a78bfa', score: 90 },
            { icon: '◈', title: 'Web Portal', desc: 'Fake admin login. Captures credential spray and recon.', color: '#38bdf8', score: 70 },
            { icon: '◎', title: 'Fake API', desc: 'Decoy REST endpoints. Detects enumeration and fuzzing.', color: '#06ffa5', score: 40 },
            { icon: '◆', title: 'Honeytokens', desc: 'Fake AWS keys. If used, a breach has occurred.', color: '#ff4d6d', score: 95 },
          ].map((h, i) => (
            <div key={i} className="hcard" style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '26px' }}>
              <div style={{ fontSize: '26px', marginBottom: '14px', color: h.color }}>{h.icon}</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>{h.title}</div>
              <p style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.7, marginBottom: '18px' }}>{h.desc}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px' }}>
                <span style={{ color: '#374151', letterSpacing: '1px' }}>THREAT SCORE</span>
                <span style={{ color: h.color, fontWeight: 700 }}>{h.score}</span>
              </div>
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <div style={{ width: `${h.score}%`, height: '100%', background: h.color, borderRadius: '2px', opacity: 0.7 }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section style={{ position: 'relative', zIndex: 10, padding: '80px 48px 120px', borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <div style={{ marginBottom: '56px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '16px' }}>THE PROCESS</div>
          <h2 style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', color: '#e2e8f0' }}>How it works.</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {[
            { num: '01', title: 'Deploy Decoys', desc: 'One-click deployment of fake servers, portals, APIs across your infrastructure.' },
            { num: '02', title: 'Attacker Arrives', desc: 'An attacker probes your network and stumbles into a honeypot.' },
            { num: '03', title: 'We Capture', desc: 'IP, location, ISP, commands, payloads — all captured silently.' },
            { num: '04', title: 'You Get Alerted', desc: 'Instant Discord alert with an AI-generated threat summary.' },
          ].map((s, i) => (
            <div key={i} style={{ padding: '28px', borderLeft: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', letterSpacing: '2px', marginBottom: '16px' }}>{s.num}</div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>{s.title}</h3>
              <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.8 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 10, padding: '100px 48px', textAlign: 'center', borderTop: '0.5px solid rgba(255,255,255,0.04)' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '250px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '20px' }}>START TODAY</div>
          <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '20px', lineHeight: 1, background: 'linear-gradient(135deg, #ffffff, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Let attackers walk<br />into your traps.
          </h2>
          <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '44px', maxWidth: '380px', margin: '0 auto 44px', lineHeight: 1.7 }}>100% free. No credit card. Real attackers. Real data.</p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', color: 'black', border: 'none', borderRadius: '40px', padding: '18px 40px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              Deploy DecoyShield
              <span style={{ background: 'black', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</span>
            </button>
            <button style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '40px', padding: '18px 40px', fontSize: '15px', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.color = '#c8b8ff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#6b7280' }}>
              View Live Dashboard
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '28px 48px', borderTop: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#1a0a2e" stroke="#7c3aed" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="4" fill="#7c3aed" />
          </svg>
          <span style={{ fontSize: '12px', color: '#374151', letterSpacing: '1px' }}>DECOYSHIELD</span>
        </div>
        <div style={{ fontSize: '12px', color: '#1f2937' }}>Fake targets. Real protection.</div>
        <div style={{ fontSize: '12px', color: '#1f2937' }}>Built by kunal-gangani</div>
      </footer>
    </div>
  )
}