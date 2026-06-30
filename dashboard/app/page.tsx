'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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
    const [showModal, setShowModal] = useState(false)
    const animRef = useRef<number>(0)
    const router = useRouter()

    const aboutRef = useRef<HTMLElement>(null)
    const arsenalRef = useRef<HTMLElement>(null)
    const processRef = useRef<HTMLElement>(null)
    const ctaRef = useRef<HTMLElement>(null)

    function scrollTo(ref: React.RefObject<HTMLElement | null>) {
        ref.current?.scrollIntoView({ behavior: 'smooth' })
    }

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

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        canvas.width = window.innerWidth
        canvas.height = window.innerHeight

        const handleResize = () => {
            if (!canvas) return
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        window.addEventListener('resize', handleResize)

        const colors = ['#7c3aed', '#a855f7', '#ec4899', '#06ffa5', '#38bdf8']
        const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number; color: string }[] = []
        for (let i = 0; i < 100; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 1.5 + 0.3,
                a: Math.random() * 0.5 + 0.1,
                color: colors[Math.floor(Math.random() * colors.length)],
            })
        }

        const trail: { x: number; y: number; a: number }[] = []

        function drawHexGrid() {
            const W = canvas!.width, H = canvas!.height
            const size = 32, h = size * Math.sqrt(3)
            ctx!.strokeStyle = 'rgba(124,58,237,0.05)'
            ctx!.lineWidth = 0.5
            for (let row = -1; row < H / h + 2; row++) {
                for (let col = -1; col < W / (size * 1.5) + 2; col++) {
                    const x = col * size * 1.5
                    const y = row * h + (col % 2 === 0 ? 0 : h / 2)
                    ctx!.beginPath()
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI / 180) * (60 * i - 30)
                        i === 0
                            ? ctx!.moveTo(x + size * Math.cos(a), y + size * Math.sin(a))
                            : ctx!.lineTo(x + size * Math.cos(a), y + size * Math.sin(a))
                    }
                    ctx!.closePath()
                    ctx!.stroke()
                }
            }
        }

        function drawSigil(mx: number, my: number, t: number) {
            const W = canvas!.width, H = canvas!.height
            const cx = W * 0.72
            const cy = H * 0.48
            const scale = Math.min(W, H) * 0.26
            const tiltX = (mx / W - 0.5) * 0.15
            const tiltY = (my / H - 0.5) * 0.1
            const c = ctx!

            c.save()
            c.translate(cx, cy)

            // Outer aura
            const aura = c.createRadialGradient(0, 0, 0, 0, 0, scale * 1.3)
            aura.addColorStop(0, 'rgba(124,58,237,0.1)')
            aura.addColorStop(0.6, 'rgba(124,58,237,0.04)')
            aura.addColorStop(1, 'transparent')
            c.fillStyle = aura
            c.beginPath()
            c.arc(0, 0, scale * 1.3, 0, Math.PI * 2)
            c.fill()

            // Slow continuous rotation + mouse tilt
            const rot = t * 0.0025

            // ---- Outer rotating ring of nodes ----
            c.save()
            c.rotate(rot + tiltX)
            const outerNodes = 12
            for (let i = 0; i < outerNodes; i++) {
                const a = (i / outerNodes) * Math.PI * 2
                const r = scale * 1.05
                const nx = Math.cos(a) * r
                const ny = Math.sin(a) * r
                const pulse = Math.sin(t * 0.04 + i) * 0.5 + 0.5
                c.beginPath()
                c.arc(nx, ny, 2 + pulse * 1.5, 0, Math.PI * 2)
                c.fillStyle = `rgba(167,139,250,${0.3 + pulse * 0.4})`
                c.fill()
                if (i % 3 === 0) {
                    c.beginPath()
                    c.moveTo(nx, ny)
                    c.lineTo(Math.cos(a) * scale * 0.85, Math.sin(a) * scale * 0.85)
                    c.strokeStyle = `rgba(167,139,250,${0.15 + pulse * 0.15})`
                    c.lineWidth = 0.5
                    c.stroke()
                }
            }
            c.beginPath()
            c.arc(0, 0, scale * 1.05, 0, Math.PI * 2)
            c.strokeStyle = 'rgba(124,58,237,0.15)'
            c.lineWidth = 0.5
            c.stroke()
            c.restore()

            // ---- Mid ring — dashed, counter-rotating ----
            c.save()
            c.rotate(-rot * 1.4 + tiltY)
            c.beginPath()
            c.arc(0, 0, scale * 0.82, 0, Math.PI * 2)
            c.strokeStyle = 'rgba(56,189,248,0.25)'
            c.lineWidth = 0.6
            c.setLineDash([6, 10])
            c.stroke()
            c.setLineDash([])
            c.restore()

            // ---- Hexagonal core frame (the shield mark, larger) ----
            c.save()
            c.rotate(rot * 0.6 + tiltX * 0.5)

            const hexOuter = (r: number) => {
                const pts: [number, number][] = []
                for (let i = 0; i < 6; i++) {
                    const a = (Math.PI / 3) * i - Math.PI / 2
                    pts.push([Math.cos(a) * r, Math.sin(a) * r])
                }
                return pts
            }

            // outer hex
            const hexR = scale * 0.58
            const outerHex = hexOuter(hexR)
            c.beginPath()
            outerHex.forEach(([x, y], i) => i === 0 ? c.moveTo(x, y) : c.lineTo(x, y))
            c.closePath()
            c.fillStyle = 'rgba(5,5,5,0.7)'
            c.fill()
            c.strokeStyle = 'rgba(124,58,237,0.6)'
            c.lineWidth = 1.2
            c.stroke()

            // inner hex (slightly rotated, offset)
            c.save()
            c.rotate(Math.PI / 6)
            const innerHex = hexOuter(hexR * 0.62)
            c.beginPath()
            innerHex.forEach(([x, y], i) => i === 0 ? c.moveTo(x, y) : c.lineTo(x, y))
            c.closePath()
            c.strokeStyle = 'rgba(167,139,250,0.4)'
            c.lineWidth = 0.6
            c.stroke()
            c.restore()

            // connecting spokes outer -> inner vertices
            outerHex.forEach(([x, y]) => {
                c.beginPath()
                c.moveTo(0, 0)
                c.lineTo(x, y)
                c.strokeStyle = 'rgba(124,58,237,0.12)'
                c.lineWidth = 0.4
                c.stroke()
            })

            c.restore()

            // ---- Core glow + pulse ----
            const corePulse = Math.sin(t * 0.025) * 0.3 + 0.7
            const coreGlow = c.createRadialGradient(0, 0, 0, 0, 0, scale * 0.22)
            coreGlow.addColorStop(0, `rgba(168,85,247,${0.5 * corePulse})`)
            coreGlow.addColorStop(1, 'transparent')
            c.fillStyle = coreGlow
            c.beginPath()
            c.arc(0, 0, scale * 0.22, 0, Math.PI * 2)
            c.fill()

            // Core diamond (echoes the shield's inner mark)
            c.save()
            c.rotate(rot * -0.8)
            const coreR = scale * 0.085
            c.beginPath()
            c.moveTo(0, -coreR)
            c.lineTo(coreR, 0)
            c.lineTo(0, coreR)
            c.lineTo(-coreR, 0)
            c.closePath()
            c.fillStyle = `rgba(200,184,255,${0.6 + corePulse * 0.3})`
            c.fill()
            c.strokeStyle = 'rgba(124,58,237,0.8)'
            c.lineWidth = 1
            c.stroke()
            c.restore()

            c.beginPath()
            c.arc(0, 0, 3, 0, Math.PI * 2)
            c.fillStyle = '#a855f7'
            c.fill()

            // ---- Scan ring sweep ----
            const sweepA = (t * 0.015) % (Math.PI * 2)
            c.save()
            c.rotate(sweepA)
            const sweepGrad = c.createLinearGradient(0, -scale * 0.95, 0, -scale * 0.5)
            sweepGrad.addColorStop(0, 'rgba(6,255,165,0.5)')
            sweepGrad.addColorStop(1, 'transparent')
            c.strokeStyle = sweepGrad
            c.lineWidth = 1.5
            c.beginPath()
            c.moveTo(0, -scale * 0.5)
            c.lineTo(0, -scale * 0.95)
            c.stroke()
            c.restore()

            // ---- Status ticks around the very outer edge ----
            for (let i = 0; i < 5; i++) {
                const a = (i / 5) * Math.PI * 2 + rot * 2
                const on = Math.sin(t * 0.05 + i * 1.3) > 0.2
                const tx = Math.cos(a) * scale * 1.18
                const ty = Math.sin(a) * scale * 1.18
                c.beginPath()
                c.arc(tx, ty, 1.8, 0, Math.PI * 2)
                c.fillStyle = on ? 'rgba(6,255,165,0.85)' : 'rgba(6,255,165,0.15)'
                c.fill()
            }

            c.restore()

            // Left fade — blend into page
            const lf = c.createLinearGradient(0, 0, cx - scale * 1.0, 0)
            lf.addColorStop(0, 'rgba(5,5,5,1)')
            lf.addColorStop(1, 'transparent')
            ctx!.fillStyle = lf
            ctx!.fillRect(0, 0, cx - scale * 1.0, H)

            // Bottom fade
            const bf = ctx!.createLinearGradient(0, H - scale * 0.7, 0, H)
            bf.addColorStop(0, 'transparent')
            bf.addColorStop(1, 'rgba(5,5,5,1)')
            ctx!.fillStyle = bf
            ctx!.fillRect(0, H - scale * 0.7, W, scale * 0.7)
        }

        let t = 0
        function animate() {
            if (!canvas || !ctx) return
            const W = canvas.width, H = canvas.height
            ctx.fillStyle = 'rgba(5,5,5,0.18)'; ctx.fillRect(0, 0, W, H)
            drawHexGrid()

            trail.push({ x: mouseRef.current.x, y: mouseRef.current.y, a: 0.8 })
            if (trail.length > 24) trail.shift()
            trail.forEach((pt, i) => {
                pt.a *= 0.88
                ctx.beginPath(); ctx.arc(pt.x, pt.y, (i / trail.length) * 6 + 1, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(124,58,237,${pt.a * 0.5})`; ctx.fill()
            })

            const rippleR = (t * 3) % 60
            ctx.beginPath(); ctx.arc(mouseRef.current.x, mouseRef.current.y, rippleR, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(124,58,237,${0.3 * (1 - rippleR / 60)})`; ctx.lineWidth = 0.5; ctx.stroke()

            particles.forEach((p, i) => {
                p.x += p.vx; p.y += p.vy
                if (p.x < 0 || p.x > W) p.vx *= -1
                if (p.y < 0 || p.y > H) p.vy *= -1
                const dx = p.x - mouseRef.current.x, dy = p.y - mouseRef.current.y
                const dist = Math.sqrt(dx * dx + dy * dy)
                if (dist < 120) { p.vx += (dx / dist) * 0.3; p.vy += (dy / dist) * 0.3 }
                p.vx *= 0.99; p.vy *= 0.99
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
                ctx.fillStyle = p.color + Math.floor(p.a * 255).toString(16).padStart(2, '0'); ctx.fill()
                for (let j = i + 1; j < particles.length; j++) {
                    const dx2 = p.x - particles[j].x, dy2 = p.y - particles[j].y
                    const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)
                    if (d2 < 80) {
                        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(124,58,237,${(1 - d2 / 80) * 0.12})`; ctx.lineWidth = 0.3; ctx.stroke()
                    }
                }
            })

            drawSigil(mouseRef.current.x, mouseRef.current.y, t)
            t++
            animRef.current = requestAnimationFrame(animate)
        }

        animate()
        return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', handleResize) }
    }, [])

    const [dims, setDims] = useState({ w: 1440, h: 900 })
    useEffect(() => { setDims({ w: window.innerWidth, h: window.innerHeight }) }, [])
    const parallaxX = (mousePos.x / dims.w - 0.5) * 24
    const parallaxY = (mousePos.y / dims.h - 0.5) * 24

    return (
        <div style={{ minHeight: '100vh', background: '#050505', color: 'white', fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .fade1{animation:fadeUp 0.8s ease 0.1s both}
        .fade2{animation:fadeUp 0.8s ease 0.25s both}
        .fade3{animation:fadeUp 0.8s ease 0.4s both}
        .fade4{animation:fadeUp 0.8s ease 0.55s both}
        .fade5{animation:fadeUp 0.8s ease 0.7s both}
        .hcard{transition:all 0.3s ease;cursor:pointer}
        .hcard:hover{transform:translateY(-6px);background:rgba(124,58,237,0.1)!important;border-color:rgba(124,58,237,0.35)!important}
        .nav-link{position:relative;transition:color 0.2s;text-decoration:none;cursor:pointer;background:none;border:none;font-size:13px;padding:0}
        .nav-link::after{content:'';position:absolute;bottom:-2px;left:0;width:0;height:1px;background:#a78bfa;transition:width 0.3s}
        .nav-link:hover{color:#e2e8f0!important}
        .nav-link:hover::after{width:100%}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#050505}
        ::-webkit-scrollbar-thumb{background:#7c3aed40;border-radius:4px}
      `}</style>

            {/* Modal */}
            {showModal && (
                <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: '#0d0d1a', border: '0.5px solid rgba(124,58,237,0.4)', borderRadius: '24px', padding: '48px', maxWidth: '440px', width: '90%', textAlign: 'center', animation: 'modalIn 0.3s ease', position: 'relative' }}>
                        <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '16px', right: '20px', background: 'transparent', border: 'none', color: '#4b5563', fontSize: '22px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(124,58,237,0.12)', border: '0.5px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                                    <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#1a0a2e" stroke="#7c3aed" strokeWidth="1.5" />
                                    <polygon points="18,7 28,13 28,23 18,29 8,23 8,13" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
                                    <path d="M18 11 L22 15 L18 13 L14 15 Z" fill="#c8b8ff" />
                                    <path d="M14 15 L18 13 L22 15 L22 21 L18 25 L14 21 Z" fill="none" stroke="#c8b8ff" strokeWidth="0.8" />
                                    <circle cx="18" cy="18" r="2" fill="#7c3aed" />
                                    <circle cx="18" cy="18" r="1" fill="#c8b8ff" />
                                </svg>
                            </div>
                        </div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#a78bfa', letterSpacing: '3px', fontWeight: 700, background: 'rgba(124,58,237,0.1)', border: '0.5px solid rgba(124,58,237,0.25)', borderRadius: '20px', padding: '5px 12px', marginBottom: '20px' }}>
                            COMING SOON
                        </div>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px', marginBottom: '12px', background: 'linear-gradient(135deg, #ffffff, #c8b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            We're deploying traps.
                        </h2>
                        <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: 1.8, marginBottom: '32px' }}>
                            Full deployment is coming very soon. In the meantime, explore the live dashboard to see real attack data being captured right now.
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => { setShowModal(false); router.push('/dashboard') }}
                                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'opacity 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                            >
                                View Live Dashboard →
                            </button>
                            <a
                                href="https://github.com/kunal-gangani/DecoyShield"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'transparent',
                                    border: '0.5px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    color: '#6b7280',
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'none',
                                    display: 'block',
                                    boxSizing: 'border-box',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'
                                    e.currentTarget.style.color = '#c8b8ff'
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                                    e.currentTarget.style.color = '#6b7280'
                                }}
                            >
                                View on GitHub ↗
                            </a>
                        </div>
                    </div>
                </div>
            )
            }

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
                <div style={{ display: 'flex', gap: '32px', fontSize: '13px' }}>
                    <button className="nav-link" style={{ color: '#6b7280' }} onClick={() => scrollTo(aboutRef)}>Platform</button>
                    <button className="nav-link" style={{ color: '#6b7280' }} onClick={() => scrollTo(arsenalRef)}>Honeypots</button>
                    <button className="nav-link" style={{ color: '#6b7280' }} onClick={() => scrollTo(processRef)}>Intelligence</button>
                    <button className="nav-link" style={{ color: '#6b7280' }} onClick={() => scrollTo(ctaRef)}>Pricing</button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#06ffa5', background: 'rgba(6,255,165,0.08)', border: '0.5px solid rgba(6,255,165,0.2)', borderRadius: '20px', padding: '5px 12px' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06ffa5', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                        LIVE
                    </div>
                    <button onClick={() => setShowModal(true)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', borderRadius: '30px', color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
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
                            <span style={{ color: 'transparent', WebkitTextStroke: '1px rgba(124,58,237,0.6)' }}>SHIELD</span>
                        </h1>
                    </div>
                    <div className="fade3">
                        <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.8, marginBottom: '40px', maxWidth: '420px' }}>
                            Deploy invisible traps. Every attacker that touches a decoy is caught, profiled, and alerted — before they reach anything real.
                        </p>
                    </div>
                    <div className="fade4" style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '60px' }}>
                        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', color: 'black', border: 'none', borderRadius: '40px', padding: '16px 32px', fontSize: '14px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.background = '#f0e8ff' }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'white' }}>
                            Start Trapping
                            <span style={{ background: 'black', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>→</span>
                        </button>
                        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.12)', borderRadius: '40px', padding: '16px 32px', fontSize: '14px', color: '#9ca3af', cursor: 'pointer', transition: 'all 0.2s' }}
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
            <section ref={aboutRef} style={{ position: 'relative', zIndex: 10, padding: '120px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(4px)' }}>
                <div>
                    <h2 style={{ fontSize: 'clamp(80px, 14vw, 160px)', fontWeight: 900, lineHeight: 0.9, letterSpacing: '-4px', background: 'linear-gradient(180deg, #1a1a2e 0%, transparent 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', userSelect: 'none' }}>ABOUT</h2>
                </div>
                <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '20px' }}>WHAT IS DECOYSHIELD</div>
                    <h3 style={{ fontSize: '26px', fontWeight: 700, lineHeight: 1.3, marginBottom: '20px', color: '#e2e8f0' }}>Deception is your strongest defense against attackers who never expect it.</h3>
                    <p style={{ color: '#4b5563', lineHeight: 1.9, marginBottom: '20px', fontSize: '15px' }}>DecoyShield deploys fake SSH servers, fake admin portals, fake APIs, and fake credentials. When an attacker touches any decoy — we capture everything.</p>
                    <p style={{ color: '#374151', lineHeight: 1.9, fontSize: '15px', marginBottom: '32px' }}>Nobody should ever touch a honeypot. If they do, it matters. You'll know the moment it happens.</p>
                    <button onClick={() => scrollTo(arsenalRef)} style={{ padding: '14px 32px', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '40px', background: 'transparent', color: '#9ca3af', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.1)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)'; e.currentTarget.style.color = '#c8b8ff' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#9ca3af' }}>
                        See the Arsenal →
                    </button>
                </div>
            </section>

            {/* Arsenal */}
            <section ref={arsenalRef} style={{ position: 'relative', zIndex: 10, padding: '80px 48px 120px', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(4px)' }}>
                <div style={{ marginBottom: '56px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '16px' }}>DECEPTION ARSENAL</div>
                    <h2 style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', background: 'linear-gradient(135deg, #fff, #c8b8ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every trap. Every vector.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px' }}>
                    {[
                        { icon: '⬡', title: 'SSH Honeypot', desc: 'Fake server. Captures brute force, commands, and payloads in real time.', color: '#a78bfa', score: 90 },
                        { icon: '◈', title: 'Web Portal', desc: 'Fake admin login. Captures credential spray and recon behavior.', color: '#38bdf8', score: 70 },
                        { icon: '◎', title: 'Fake API', desc: 'Decoy REST endpoints. Detects enumeration and fuzzing automatically.', color: '#06ffa5', score: 40 },
                        { icon: '◆', title: 'Honeytokens', desc: 'Fake AWS keys. If used, a real breach has occurred. Zero false positives.', color: '#ff4d6d', score: 95 },
                    ].map((h, i) => (
                        <div key={i} className="hcard" onClick={() => router.push('/dashboard')} style={{ background: 'rgba(255,255,255,0.025)', border: '0.5px solid rgba(255,255,255,0.07)', borderRadius: '16px', padding: '26px' }}>
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
                            <div style={{ marginTop: '12px', fontSize: '11px', color: '#374151' }}>View live data →</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Process */}
            <section ref={processRef} style={{ position: 'relative', zIndex: 10, padding: '80px 48px 120px', borderTop: '0.5px solid rgba(255,255,255,0.04)', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(4px)' }}>
                <div style={{ marginBottom: '56px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '16px' }}>THE PROCESS</div>
                    <h2 style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-2px', color: '#e2e8f0' }}>How it works.</h2>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
                    {[
                        { num: '01', title: 'Deploy Decoys', desc: 'One-click deployment of fake servers, portals, and APIs.', action: () => setShowModal(true), cta: 'Deploy now →' },
                        { num: '02', title: 'Attacker Arrives', desc: 'An attacker probes your network and stumbles into a honeypot.', action: () => router.push('/dashboard'), cta: 'See live feed →' },
                        { num: '03', title: 'We Capture', desc: 'IP, location, ISP, commands, payloads — all captured silently.', action: () => router.push('/dashboard'), cta: 'View captures →' },
                        { num: '04', title: 'You Get Alerted', desc: 'Instant Discord alert with an AI-generated threat summary.', action: () => router.push('/dashboard'), cta: 'See alerts →' },
                    ].map((s, i) => (
                        <div key={i} onClick={s.action} style={{ padding: '28px', borderLeft: i === 0 ? 'none' : '0.5px solid rgba(255,255,255,0.04)', cursor: 'pointer', transition: 'background 0.2s', borderRadius: '8px' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.05)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', letterSpacing: '2px', marginBottom: '16px' }}>{s.num}</div>
                            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#e2e8f0', marginBottom: '10px' }}>{s.title}</h3>
                            <p style={{ fontSize: '13px', color: '#4b5563', lineHeight: 1.8, marginBottom: '12px' }}>{s.desc}</p>
                            <span style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600 }}>{s.cta}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section ref={ctaRef} style={{ position: 'relative', zIndex: 10, padding: '100px 48px', textAlign: 'center', borderTop: '0.5px solid rgba(255,255,255,0.04)', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(4px)' }}>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '500px', height: '250px', background: 'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '3px', color: '#6b7280', marginBottom: '20px' }}>FREE FOREVER</div>
                    <h2 style={{ fontSize: 'clamp(36px, 5vw, 64px)', fontWeight: 900, letterSpacing: '-2px', marginBottom: '20px', lineHeight: 1, background: 'linear-gradient(135deg, #ffffff, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                        Let attackers walk<br />into your traps.
                    </h2>
                    <p style={{ fontSize: '15px', color: '#4b5563', marginBottom: '44px', maxWidth: '380px', margin: '0 auto 44px', lineHeight: 1.7 }}>100% free. No credit card. No investment. Real attackers. Real data.</p>
                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center' }}>
                        <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', color: 'black', border: 'none', borderRadius: '40px', padding: '18px 40px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            Deploy DecoyShield
                            <span style={{ background: 'black', color: 'white', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>→</span>
                        </button>
                        <button onClick={() => router.push('/dashboard')} style={{ background: 'transparent', border: '0.5px solid rgba(255,255,255,0.1)', borderRadius: '40px', padding: '18px 40px', fontSize: '15px', color: '#6b7280', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(167,139,250,0.4)'; e.currentTarget.style.color = '#c8b8ff' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#6b7280' }}>
                            View Live Dashboard
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ position: 'relative', zIndex: 10, padding: '28px 48px', borderTop: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(5,5,5,0.95)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="22" height="22" viewBox="0 0 36 36" fill="none">
                        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#1a0a2e" stroke="#7c3aed" strokeWidth="1.5" />
                        <circle cx="18" cy="18" r="4" fill="#7c3aed" />
                    </svg>
                    <span style={{ fontSize: '12px', color: '#374151', letterSpacing: '1px' }}>DECOYSHIELD</span>
                </div>
                <div style={{ fontSize: '12px', color: '#1f2937' }}>Fake targets. Real protection.</div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span onClick={() => router.push('/dashboard')} style={{ color: '#374151', cursor: 'pointer', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                        onMouseLeave={e => e.currentTarget.style.color = '#374151'}>Dashboard</span>
                    <a href="https://github.com/kunal-gangani/DecoyShield" target="_blank" rel="noopener noreferrer" style={{ color: '#374151', textDecoration: 'none', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#a78bfa'}
                        onMouseLeave={e => e.currentTarget.style.color = '#374151'}>GitHub ↗</a>
                </div>
            </footer>
        </div >
    )
}