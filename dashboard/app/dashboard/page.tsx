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
    if (score >= 90) return { label: 'CRITICAL', color: '#ff4d6d', glow: '255,77,109', dim: 'rgba(255,77,109,0.1)' }
    if (score >= 70) return { label: 'HIGH', color: '#ff6b35', glow: '255,107,53', dim: 'rgba(255,107,53,0.1)' }
    if (score >= 40) return { label: 'MEDIUM', color: '#ffd60a', glow: '255,214,10', dim: 'rgba(255,214,10,0.1)' }
    return { label: 'LOW', color: '#06ffa5', glow: '6,255,165', dim: 'rgba(6,255,165,0.1)' }
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
            const grad = ctx.createLinearGradient(0, 0, canvas.width, 0)
            grad.addColorStop(0, 'rgba(124,58,237,0.3)')
            grad.addColorStop(1, 'rgba(168,85,247,0.8)')
            ctx.beginPath()
            hbPointsRef.current.forEach((v, i) => {
                const x = (i / 59) * canvas.width
                const y = canvas.height - v * canvas.height * 0.85 - 2
                i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
            })
            ctx.strokeStyle = grad
            ctx.lineWidth = 1.5
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
            ctx.strokeStyle = 'rgba(124,58,237,0.04)'
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
            // Outer glow rings
            for (let i = 4; i >= 1; i--) {
                ctx.beginPath()
                ctx.arc(cx, cy, 24 * i * pulse, 0, Math.PI * 2)
                ctx.strokeStyle = `rgba(124,58,237,${0.08 / i})`
                ctx.lineWidth = 0.5
                ctx.stroke()
            }
            // Hex shape
            const pts = 6, r = 16
            ctx.beginPath()
            for (let i = 0; i < pts; i++) {
                const a = ((Math.PI * 2) / pts) * i - Math.PI / 2
                const px = cx + r * Math.cos(a), py = cy + r * Math.sin(a)
                i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
            }
            ctx.closePath()
            ctx.fillStyle = 'rgba(124,58,237,0.15)'
            ctx.fill()
            ctx.strokeStyle = 'rgba(167,139,250,0.8)'
            ctx.lineWidth = 1
            ctx.stroke()
            // Center dot
            ctx.beginPath()
            ctx.arc(cx, cy, 4, 0, Math.PI * 2)
            ctx.fillStyle = '#a855f7'
            ctx.fill()
            // Label
            ctx.font = '500 9px Inter, sans-serif'
            ctx.fillStyle = 'rgba(200,184,255,0.5)'
            ctx.textAlign = 'center'
            ctx.fillText('YOU', cx, cy + 26)
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

                // Outer glow
                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR * 3, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${risk.glow},${isSelected ? 0.1 : 0.04})`
                ctx.fill()

                // Mid ring
                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR * 1.5, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(${risk.glow},0.15)`
                ctx.fill()

                // Core
                ctx.beginPath()
                ctx.arc(o.x, o.y, pulseR * 0.6, 0, Math.PI * 2)
                ctx.fillStyle = risk.color
                ctx.fill()

                // Selection ring
                if (isSelected) {
                    ctx.beginPath()
                    ctx.arc(o.x, o.y, pulseR + 8, 0, Math.PI * 2)
                    ctx.strokeStyle = risk.color
                    ctx.lineWidth = 1
                    ctx.setLineDash([4, 4])
                    ctx.stroke()
                    ctx.setLineDash([])
                }

                // Connector line
                ctx.beginPath()
                ctx.moveTo(W / 2, H / 2)
                ctx.lineTo(o.x, o.y)
                ctx.strokeStyle = `rgba(${risk.glow},${isSelected ? 0.2 : 0.05})`
                ctx.lineWidth = isSelected ? 0.8 : 0.4
                ctx.setLineDash([3, 8])
                ctx.stroke()
                ctx.setLineDash([])

                // IP label
                ctx.font = '500 9px Inter, sans-serif'
                ctx.fillStyle = `rgba(${risk.glow},${isSelected ? 0.9 : 0.6})`
                ctx.textAlign = 'center'
                ctx.fillText(o.event.ip, o.x, o.y + pulseR + 16)
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
            if (Math.sqrt(dx * dx + dy * dy) < o.r * 3.5) hit = o
        })
        selectedOrbRef.current = hit
        setSelected(hit ? (hit as Orb).event : null)
        forceUpdate(n => n + 1)
    }

    const risk = selected ? getRisk(selected.risk_score) : null

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #050505; overflow: hidden; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-8px)} to{opacity:1;transform:translateX(0)} }
        .feed-item { transition: all 0.2s ease; }
        .feed-item:hover { background: rgba(124,58,237,0.06) !important; transform: translateX(2px); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 3px; }
      `}</style>

            <div style={{ background: '#050505', color: '#e2e8f0', height: '100vh', display: 'grid', gridTemplateColumns: '220px 1fr 300px', overflow: 'hidden' }}>

                {/* Purple orb backgrounds */}
                <div style={{ position: 'fixed', top: '-200px', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                <div style={{ position: 'fixed', bottom: '-100px', right: '200px', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(236,72,153,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

                {/* LEFT SIDEBAR */}
                <div style={{ borderRight: '0.5px solid rgba(255,255,255,0.06)', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', zIndex: 10, position: 'relative' }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '16px', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(124,58,237,0.4)', flexShrink: 0 }}>
                            <svg width="20" height="20" viewBox="0 0 36 36" fill="none">
                                <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="white" strokeWidth="2" />
                                <circle cx="18" cy="18" r="4" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '1px' }}>DECOYSHIELD</div>
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', marginTop: '1px' }}>PREDATOR VIEW</div>
                        </div>
                    </div>

                    {/* Back button */}
                    <button
                        onClick={() => router.push('/')}
                        style={{ background: 'rgba(124,58,237,0.08)', border: '0.5px solid rgba(124,58,237,0.2)', borderRadius: '30px', padding: '9px 16px', color: '#a78bfa', fontSize: '12px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s', letterSpacing: '0.3px' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.4)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)' }}
                    >
                        ← Back to Home
                    </button>

                    {/* Live pill */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6,255,165,0.08)', border: '0.5px solid rgba(6,255,165,0.2)', borderRadius: '20px', padding: '5px 12px', width: 'fit-content' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06ffa5', display: 'inline-block', boxShadow: '0 0 8px #06ffa5', animation: 'pulse 1.5s infinite' }} />
                        <span style={{ fontSize: '10px', color: '#06ffa5', letterSpacing: '1.5px', fontWeight: 600 }}>LIVE</span>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {[
                            { label: 'Threats Caught', value: stats?.total_events ?? 0, color: '#a78bfa' },
                            { label: 'High Risk', value: stats?.high_risk_events ?? 0, color: '#ff4d6d' },
                            { label: 'Nations', value: stats?.unique_countries?.length ?? 0, color: '#38bdf8' },
                            { label: 'Active Traps', value: 3, color: '#06ffa5' },
                        ].map(s => (
                            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>{s.label}</span>
                                <span style={{ fontSize: '22px', fontWeight: 800, color: s.color, letterSpacing: '-1px', lineHeight: 1 }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* Heartbeat */}
                    <div style={{ background: 'rgba(124,58,237,0.04)', border: '0.5px solid rgba(124,58,237,0.1)', borderRadius: '10px', padding: '10px 12px' }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600, marginBottom: '8px' }}>HEARTBEAT</div>
                        <canvas ref={hbCanvasRef} width={184} height={32} style={{ width: '100%', height: '32px' }} />
                    </div>

                    {/* Feed */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600, marginBottom: '10px' }}>THREAT LOG</div>
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {events.length === 0 ? (
                                <div style={{ color: 'rgba(255,255,255,0.1)', fontSize: '11px', animation: 'pulse 2s infinite', textAlign: 'center', paddingTop: '20px' }}>awaiting contact...</div>
                            ) : events.map(e => {
                                const r = getRisk(e.risk_score)
                                const isActive = selected?.id === e.id
                                return (
                                    <div
                                        key={e.id}
                                        className="feed-item"
                                        onClick={() => {
                                            const orb = orbsRef.current.find(o => o.event.id === e.id) || null
                                            selectedOrbRef.current = orb
                                            setSelected(e)
                                        }}
                                        style={{
                                            padding: '8px 10px',
                                            borderLeft: `2px solid ${r.color}`,
                                            cursor: 'pointer',
                                            background: isActive ? `rgba(${r.glow},0.08)` : 'transparent',
                                            borderRadius: '0 6px 6px 0',
                                            animation: 'slideIn 0.3s ease',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                            <span style={{ fontSize: '12px', color: r.color, fontWeight: 600 }}>{e.ip}</span>
                                            <span style={{ fontSize: '9px', color: r.color, background: r.dim, padding: '1px 6px', borderRadius: '10px', fontWeight: 700 }}>{r.label}</span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{e.event_type.replace(/_/g, ' ')} · {timeAgo(e.created_at)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* CENTER CANVAS */}
                <div ref={centerRef} onClick={handleCenterClick} style={{ position: 'relative', cursor: 'crosshair', overflow: 'hidden', background: '#050505', zIndex: 5 }}>
                    <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                    <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', color: 'rgba(255,255,255,0.08)', letterSpacing: '3px', whiteSpace: 'nowrap', pointerEvents: 'none', fontWeight: 600 }}>
                        CLICK AN ORB TO INVESTIGATE
                    </div>
                </div>

                {/* RIGHT DETAIL */}
                <div style={{ borderLeft: '0.5px solid rgba(255,255,255,0.06)', padding: '20px 16px', background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', overflowY: 'auto', zIndex: 10, position: 'relative' }}>
                    {!selected ? (
                        <div style={{ paddingTop: '80px', textAlign: 'center', color: 'rgba(255,255,255,0.08)' }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(124,58,237,0.06)', border: '0.5px solid rgba(124,58,237,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                                    <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="rgba(124,58,237,0.3)" strokeWidth="1.5" />
                                    <circle cx="18" cy="18" r="4" fill="rgba(124,58,237,0.3)" />
                                </svg>
                            </div>
                            <div style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.12)', marginBottom: '4px' }}>No threat selected</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.06)' }}>Click an orb to investigate</div>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.3s ease' }}>

                            {/* IP Hero Card */}
                            <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.06))', border: '0.5px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600, marginBottom: '6px' }}>TARGET IP</div>
                                <div style={{ fontSize: '20px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px', marginBottom: '6px', wordBreak: 'break-all' }}>{selected.ip}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>{[selected.country, selected.city].filter(Boolean).join(' · ') || 'Unknown location'}</div>
                                <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: `rgba(${risk!.glow},0.1)`, border: `0.5px solid rgba(${risk!.glow},0.25)`, borderRadius: '20px', padding: '4px 12px' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: risk!.color, display: 'inline-block', boxShadow: `0 0 6px ${risk!.color}` }} />
                                    <span style={{ fontSize: '10px', color: risk!.color, fontWeight: 700, letterSpacing: '1px' }}>{risk!.label}</span>
                                </div>
                            </div>

                            {/* Info grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                                {[
                                    { label: 'ISP', value: selected.isp },
                                    { label: 'Honeypot', value: selected.honeypot_type },
                                    { label: 'Event', value: selected.event_type.replace(/_/g, ' ') },
                                    { label: 'Time', value: timeAgo(selected.created_at) },
                                ].map(item => (
                                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '10px 12px' }}>
                                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase' }}>{item.label}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Risk bar */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600 }}>THREAT LEVEL</span>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: risk!.color }}>{selected.risk_score}/100</span>
                                </div>
                                <div style={{ height: '5px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${selected.risk_score}%`, height: '100%', background: `linear-gradient(90deg, ${risk!.color}80, ${risk!.color})`, borderRadius: '3px', boxShadow: `0 0 8px ${risk!.color}`, transition: 'width 0.8s ease' }} />
                                </div>
                            </div>

                            {/* Commands */}
                            {selected.commands?.length > 0 && (
                                <div style={{ background: 'rgba(0,0,0,0.3)', border: '0.5px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px' }}>
                                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600, marginBottom: '10px' }}>INTERCEPTED COMMANDS</div>
                                    {selected.commands.map((c, i) => (
                                        <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4ade80', marginBottom: '5px', display: 'flex', gap: '8px', animation: `slideIn 0.3s ease ${i * 0.06}s both` }}>
                                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>$</span>{c}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* AI Summary */}
                            {selected.ai_summary && (
                                <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(14,165,233,0.03))', border: '0.5px solid rgba(124,58,237,0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                            <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#a78bfa" />
                                        </svg>
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 600 }}>AI ANALYSIS</span>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}