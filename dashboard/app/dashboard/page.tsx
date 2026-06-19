'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getEvents, getStats } from '../../lib/api'

interface Event {
    id: string
    ip: string
    country: string
    city: string
    isp: string
    honeypot_type: string
    event_type: string
    risk_score: number
    commands: string[]
    ai_summary: string
    created_at: string
}

interface Stats {
    total_events: number
    high_risk_events: number
    unique_countries: string[]
}

interface Orb {
    event: Event
    x: number
    y: number
    vx: number
    vy: number
    r: number
    pulse: number
    pulseSpeed: number
}

function getRisk(score: number) {
    if (score >= 90) return { label: 'CRITICAL', color: '#ff4d6d', glow: '255,77,109' }
    if (score >= 70) return { label: 'HIGH', color: '#ff6b35', glow: '255,107,53' }
    if (score >= 40) return { label: 'MEDIUM', color: '#ffd60a', glow: '255,214,10' }
    return { label: 'LOW', color: '#06ffa5', glow: '6,255,165' }
}

function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
}

export default function Dashboard() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const hbCanvasRef = useRef<HTMLCanvasElement>(null)
    const orbsRef = useRef<Orb[]>([])
    const selectedOrbRef = useRef<Orb | null>(null)
    const hexPulseRef = useRef(0)
    const hbPointsRef = useRef<number[]>(Array(60).fill(0.1))
    const animRef = useRef<number>(0)
    const centerRef = useRef<HTMLDivElement>(null)
    const mouseRef = useRef({ x: 0, y: 0 })

    const [events, setEvents] = useState<Event[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [selected, setSelected] = useState<Event | null>(null)
    const [, forceUpdate] = useState(0)
    const router = useRouter()

    function initOrbs(evts: Event[], W: number, H: number) {
        const cx = W / 2, cy = H / 2
        orbsRef.current = evts.map((e, i) => {
            const angle = (i / Math.max(evts.length, 1)) * Math.PI * 2 - Math.PI / 2
            const dist = 90 + Math.random() * 70
            return {
                event: e,
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                vx: (Math.random() - 0.5) * 0.2,
                vy: (Math.random() - 0.5) * 0.2,
                r: 8 + e.risk_score / 10,
                pulse: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.02,
            }
        })
    }

    useEffect(() => {
        async function load() {
            const [eventsData, statsData] = await Promise.all([getEvents(), getStats()])
            setEvents(eventsData)
            setStats(statsData)
            const canvas = canvasRef.current
            if (canvas) initOrbs(eventsData, canvas.width, canvas.height)
        }
        load()
        const iv = setInterval(load, 15000)
        return () => clearInterval(iv)
    }, [])

    useEffect(() => {
        const hbTick = setInterval(() => {
            const latest = events[0]
            const spike = latest ? latest.risk_score / 100 : 0
            hbPointsRef.current.push(spike > 0.3 ? spike : 0.1 + Math.random() * 0.08)
            if (hbPointsRef.current.length > 60) hbPointsRef.current.shift()
            const canvas = hbCanvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.beginPath()
            hbPointsRef.current.forEach((v, i) => {
                const x = (i / 59) * canvas.width
                const y = canvas.height - v * canvas.height * 0.85 - 2
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.strokeStyle = '#7c3aed'
            ctx.lineWidth = 1
            ctx.stroke()
        }, 800)
        return () => clearInterval(hbTick)
    }, [events])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        function resize() {
            const el = centerRef.current
            if (!el || !canvas) return
            const r = el.getBoundingClientRect()
            canvas.width = r.width
            canvas.height = r.height
            initOrbs(orbsRef.current.map(o => o.event), r.width, r.height)
        }
        resize()
        window.addEventListener('resize', resize)

        function drawHexGrid() {
            if (!canvas || !ctx) return
            const W = canvas.width, H = canvas.height
            const size = 28, h = size * Math.sqrt(3)
            ctx.strokeStyle = 'rgba(124,58,237,0.06)'
            ctx.lineWidth = 0.5
            for (let row = -1; row < H / h + 2; row++) {
                for (let col = -1; col < W / (size * 1.5) + 2; col++) {
                    const x = col * size * 1.5
                    const y = row * h + (col % 2 === 0 ? 0 : h / 2)
                    ctx.beginPath()
                    for (let i = 0; i < 6; i++) {
                        const a = (Math.PI / 180) * (60 * i - 30)
                        i === 0 ? ctx.moveTo(x + size * Math.cos(a), y + size * Math.sin(a))
                            : ctx.lineTo(x + size * Math.cos(a), y + size * Math.sin(a))
                    }
                    ctx.closePath()
                    ctx.stroke()
                }
            }
        }

        function drawCenter() {
            if (!canvas || !ctx) return
            const W = canvas.width, H = canvas.height
            const cx = W / 2, cy = H / 2
            const pulse = Math.sin(hexPulseRef.current) * 0.3 + 0.7
            for (let i = 3; i >= 1; i--) {
                ctx.beginPath()
                ctx.arc(cx, cy, 20 * i * pulse, 0, Math.PI * 2)
                ctx.strokeStyle = `rgba(124,58,237,${0.15 / i})`
                ctx.lineWidth = 0.5
                ctx.stroke()
            }
            const pts = 6, r = 14
            ctx.beginPath()
            for (let i = 0; i < pts; i++) {
                const a = ((Math.PI * 2) / pts) * i - Math.PI / 2
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fillStyle = 'rgba(124,58,237,0.15)'
            ctx.fill()
            ctx.strokeStyle = '#7c3aed'
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.beginPath()
            ctx.arc(cx, cy, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#a855f7'
            ctx.fill()
            ctx.font = '9px monospace'
            ctx.fillStyle = 'rgba(200,184,255,0.4)'
            ctx.textAlign = 'center'
            ctx.fillText('YOU', cx, cy + 22)
        }

        function drawOrbs() {
            if (!canvas || !ctx) return
            const W = canvas.width, H = canvas.height
            orbsRef.current.forEach(o => {
                o.x += o.vx; o.y += o.vy
                if (o.x < o.r || o.x > W - o.r) o.vx *= -1
                if (o.y < o.r || o.y > H - o.r) o.vy *= -1
                o.pulse += o.pulseSpeed
                const risk = getRisk(o.event.risk_score)
                const pulseR = o.r + Math.sin(o.pulse) * 2
                const isSelected = selectedOrbRef.current?.event.id === o.event.id

                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR * 2.5, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${risk.glow},${isSelected ? 0.12 : 0.05})`
                ctx.fill()

                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${risk.glow},0.25)`
                ctx.fill()

                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR * 0.5, 0, Math.PI * 2)
                ctx.fillStyle = risk.color
                ctx.fill()

                if (isSelected) {
                    ctx.beginPath()
                    ctx.arc(o.x, o.y, pulseR + 6, 0, Math.PI * 2)
                    ctx.strokeStyle = risk.color
                    ctx.lineWidth = 1
                    ctx.setLineDash([4, 4])
                    ctx.stroke()
                    ctx.setLineDash([])
                }

                ctx.beginPath()
                ctx.moveTo(W / 2, H / 2)
                ctx.lineTo(o.x, o.y)
                ctx.strokeStyle = `rgba(${risk.glow},${isSelected ? 0.15 : 0.04})`
                ctx.lineWidth = 0.5
                ctx.setLineDash([3, 6])
                ctx.stroke()
                ctx.setLineDash([])

                ctx.font = '9px monospace'
                ctx.fillStyle = `rgba(${risk.glow},0.7)`
                ctx.textAlign = 'center'
                ctx.fillText(o.event.ip, o.x, o.y + pulseR + 12)
            })
        }

        function animate() {
            if (!canvas || !ctx) return
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            drawHexGrid()
            drawCenter()
            drawOrbs()
            hexPulseRef.current += 0.015
            animRef.current = requestAnimationFrame(animate)
        }
        animate()

        return () => {
            cancelAnimationFrame(animRef.current)
            window.removeEventListener('resize', resize)
        }
    }, [])

    function handleCenterClick(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        let hit: Orb | null = null
        orbsRef.current.forEach(o => {
            const dx = o.x - mx, dy = o.y - my
            if (Math.sqrt(dx * dx + dy * dy) < o.r * 3) hit = o
        })
        selectedOrbRef.current = hit
        setSelected(hit ? (hit as Orb).event : null)
        forceUpdate(n => n + 1)
    }

    const risk = selected ? getRisk(selected.risk_score) : null

    return (
        <>
            <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #03040a; overflow: hidden; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #7c3aed30; border-radius: 3px; }
      `}</style>

            <div style={{ background: '#03040a', color: '#e2e8f0', fontFamily: 'monospace', height: '100vh', display: 'grid', gridTemplateColumns: '200px 1fr 260px', overflow: 'hidden' }}>

                {/* LEFT SIDEBAR */}
                <div style={{ borderRight: '0.5px solid #ffffff08', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#03040a', zIndex: 10 }}>

                    {/* Logo + Back */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '0.5px solid #ffffff08' }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#1a0a2e" stroke="#7c3aed" strokeWidth="1" />
                            <polygon points="18,7 28,13 28,23 18,29 8,23 8,13" fill="none" stroke="#a855f7" strokeWidth="0.5" opacity="0.5" />
                            <path d="M18 11 L22 15 L18 13 L14 15 Z" fill="#c8b8ff" />
                            <path d="M14 15 L18 13 L22 15 L22 21 L18 25 L14 21 Z" fill="none" stroke="#c8b8ff" strokeWidth="0.8" />
                            <circle cx="18" cy="18" r="2" fill="#7c3aed" />
                            <circle cx="18" cy="18" r="1" fill="#c8b8ff" />
                        </svg>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 500, color: '#c8b8ff', letterSpacing: '1px' }}>DECOYSHIELD</div>
                            <div style={{ fontSize: '9px', color: '#ffffff25', letterSpacing: '2px', marginTop: '2px' }}>PREDATOR VIEW</div>
                        </div>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={() => router.push('/')}
                        style={{ background: 'rgba(124,58,237,0.08)', border: '0.5px solid rgba(124,58,237,0.2)', borderRadius: '8px', padding: '8px 12px', color: '#a78bfa', fontSize: '11px', cursor: 'pointer', textAlign: 'left', letterSpacing: '1px', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.15)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.08)'}
                    >
                        ← Back to Home
                    </button>

                    {/* Live pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#06ffa508', border: '0.5px solid #06ffa520', borderRadius: '20px', padding: '4px 10px', width: 'fit-content' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06ffa5', display: 'inline-block', animation: 'blink 1.5s infinite' }} />
                        <span style={{ fontSize: '9px', color: '#06ffa5', letterSpacing: '1px' }}>LIVE</span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {[
                            { label: 'EVENTS', value: stats?.total_events ?? 0, color: '#c8b8ff' },
                            { label: 'HIGH RISK', value: stats?.high_risk_events ?? 0, color: '#ff4d6d' },
                            { label: 'NATIONS', value: stats?.unique_countries?.length ?? 0, color: '#38bdf8' },
                            { label: 'TRAPS', value: 3, color: '#4ade80' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <span style={{ fontSize: '10px', color: '#ffffff25', letterSpacing: '1px' }}>{s.label}</span>
                                <span style={{ fontSize: '20px', fontWeight: 500, color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Heartbeat */}
                    <div>
                        <div style={{ fontSize: '9px', color: '#ffffff20', letterSpacing: '2px', marginBottom: '6px' }}>HEARTBEAT</div>
                        <canvas ref={hbCanvasRef} width={172} height={36} style={{ width: '100%', height: '36px' }} />
                    </div>

                    {/* Feed */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontSize: '9px', color: '#ffffff20', letterSpacing: '2px', marginBottom: '8px' }}>THREAT LOG</div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {events.length === 0 ? (
                                <div style={{ color: '#ffffff15', fontSize: '10px', animation: 'blink 1.5s infinite' }}>awaiting contact...</div>
                            ) : events.map(e => {
                                const r = getRisk(e.risk_score)
                                return (
                                    <div
                                        key={e.id}
                                        onClick={() => {
                                            const orb = orbsRef.current.find(o => o.event.id === e.id) || null
                                            selectedOrbRef.current = orb
                                            setSelected(e)
                                        }}
                                        style={{ paddingLeft: '8px', borderLeft: `2px solid ${r.color}`, cursor: 'pointer', padding: '5px 8px' }}
                                    >
                                        <div style={{ fontSize: '11px', color: r.color }}>{e.ip}</div>
                                        <div style={{ fontSize: '10px', color: '#ffffff30', marginTop: '1px' }}>{e.event_type.replace(/_/g, ' ')} · {timeAgo(e.created_at)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* CENTER CANVAS */}
                <div
                    ref={centerRef}
                    onClick={handleCenterClick}
                    style={{ position: 'relative', cursor: 'crosshair', overflow: 'hidden' }}
                >
                    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: '#ffffff15', letterSpacing: '2px', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
                        CLICK AN ORB TO INVESTIGATE
                    </div>
                </div>

                {/* RIGHT DETAIL */}
                <div style={{ borderLeft: '0.5px solid #ffffff08', padding: '16px 14px', background: '#03040acc', overflowY: 'auto', zIndex: 10 }}>
                    {!selected ? (
                        <div style={{ color: '#ffffff15', fontSize: '11px', textAlign: 'center', paddingTop: '60px', lineHeight: 2 }}>
                            ◎<br />select a<br />threat orb
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '0.5px solid #ffffff08' }}>
                                <div style={{ fontSize: '18px', color: '#c8b8ff', fontWeight: 500, marginBottom: '4px', wordBreak: 'break-all' }}>{selected.ip}</div>
                                <div style={{ fontSize: '11px', color: '#ffffff30', marginBottom: '10px' }}>
                                    {[selected.country, selected.city].filter(Boolean).join(' · ') || 'Unknown'}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: `rgba(${risk!.glow},0.08)`, border: `0.5px solid rgba(${risk!.glow},0.2)`, borderRadius: '20px', padding: '3px 10px', width: 'fit-content' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: risk!.color, display: 'inline-block' }} />
                                    <span style={{ fontSize: '9px', color: risk!.color, letterSpacing: '1px' }}>{risk!.label}</span>
                                </div>
                            </div>

                            {[
                                ['ISP', selected.isp],
                                ['HONEYPOT', selected.honeypot_type],
                                ['EVENT', selected.event_type.replace(/_/g, ' ')],
                                ['TIME', timeAgo(selected.created_at)],
                            ].map(([k, v]) => (
                                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #ffffff06', fontSize: '11px' }}>
                                    <span style={{ color: '#ffffff25', letterSpacing: '1px' }}>{k}</span>
                                    <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{v || '—'}</span>
                                </div>
                            ))}

                            <div style={{ margin: '14px 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '5px' }}>
                                    <span style={{ color: '#ffffff25', letterSpacing: '1px' }}>THREAT LEVEL</span>
                                    <span style={{ color: risk!.color }}>{selected.risk_score}/100</span>
                                </div>
                                <div style={{ height: '4px', background: '#ffffff08', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${selected.risk_score}%`, height: '100%', background: risk!.color, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                                </div>
                            </div>

                            {selected.commands?.length > 0 && (
                                <div style={{ marginTop: '12px' }}>
                                    <div style={{ fontSize: '9px', color: '#ffffff20', letterSpacing: '2px', marginBottom: '6px' }}>INTERCEPTED</div>
                                    {selected.commands.map((c, i) => (
                                        <div key={i} style={{ fontSize: '11px', color: '#4ade80', marginBottom: '3px' }}>$ {c}</div>
                                    ))}
                                </div>
                            )}

                            {selected.ai_summary && (
                                <div style={{ marginTop: '14px', padding: '10px', border: '0.5px solid #ffffff08', borderRadius: '6px' }}>
                                    <div style={{ fontSize: '9px', color: '#ffffff20', letterSpacing: '2px', marginBottom: '6px' }}>AI ANALYSIS</div>
                                    <div style={{ fontSize: '11px', color: '#ffffff40', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}