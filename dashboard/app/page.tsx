'use client'

import { useEffect, useState, useRef } from 'react'
import { getEvents, getStats } from '../lib/api'
import { Shield, AlertTriangle, Globe, Activity, Terminal, MapPin, Wifi, Zap, Eye, Lock } from 'lucide-react'

interface Event {
  id: string
  honeypot_type: string
  ip: string
  country: string
  city: string
  isp: string
  risk_score: number
  event_type: string
  commands: string[]
  ai_summary: string
  created_at: string
}

interface Stats {
  total_events: number
  high_risk_events: number
  unique_countries: string[]
}

function getRisk(score: number) {
  if (score >= 90) return { label: 'CRITICAL', color: '#ff4d6d', glow: '#ff4d6d', dim: '#ff4d6d12' }
  if (score >= 70) return { label: 'HIGH', color: '#ff6b35', glow: '#ff6b35', dim: '#ff6b3512' }
  if (score >= 40) return { label: 'MEDIUM', color: '#ffd60a', glow: '#ffd60a', dim: '#ffd60a12' }
  return { label: 'LOW', color: '#06ffa5', glow: '#06ffa5', dim: '#06ffa512' }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function AnimatedNumber({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.max(1, Math.ceil(value / 40))
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 20)
    return () => clearInterval(timer)
  }, [value])
  return <span style={{ color }}>{display}</span>
}

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [newIds, setNewIds] = useState<Set<string>>(new Set())
  const prevIds = useRef<Set<string>>(new Set())
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    async function load() {
      const [eventsData, statsData] = await Promise.all([getEvents(), getStats()])
      const incoming: Event[] = eventsData
      const fresh = new Set(incoming.filter(e => !prevIds.current.has(e.id)).map(e => e.id))
      if (fresh.size > 0) { setNewIds(fresh); setTimeout(() => setNewIds(new Set()), 2500) }
      prevIds.current = new Set(incoming.map(e => e.id))
      setEvents(incoming)
      setStats(statsData)
      setLoading(false)
    }
    load()
    const iv = setInterval(load, 15000)
    return () => clearInterval(iv)
  }, [])

  // Animated background canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const particles: { x: number; y: number; vx: number; vy: number; r: number; a: number }[] = []
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random()
      })
    }

    let animId: number
    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(139, 92, 246, ${p.a * 0.4})`
        ctx.fill()
      })
      // Connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 100) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(animId)
  }, [])

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #050817; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideRight { from { opacity:0; transform:translateX(-16px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes ping { 0%{transform:scale(1);opacity:1} 100%{transform:scale(2.5);opacity:0} }
        @keyframes glow { 0%,100%{box-shadow:0 0 20px #7c3aed40} 50%{box-shadow:0 0 40px #7c3aed80} }
        @keyframes borderFlow {
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #7c3aed40; border-radius: 4px; }
        .ecard { transition: all 0.2s ease; }
        .ecard:hover { transform: translateX(4px); }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#050817', color: '#e2e8f0', fontFamily: 'Inter, sans-serif', position: 'relative', overflow: 'hidden' }}>

        {/* Animated particle background */}
        <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />

        {/* Purple orbs */}
        <div style={{ position: 'fixed', top: '-200px', right: '-100px', width: '600px', height: '600px', background: 'radial-gradient(circle, #7c3aed18 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', bottom: '-200px', left: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, #0ea5e918 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', top: '40%', left: '30%', width: '300px', height: '300px', background: 'radial-gradient(circle, #ff4d6d08 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

        {/* Topbar */}
        <nav style={{ position: 'relative', zIndex: 100, background: 'rgba(5,8,23,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(124,58,237,0.2)', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px #7c3aed60', animation: 'glow 3s infinite' }}>
              <Shield size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>DecoyShield</div>
              <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '1px' }}>CYBER DECEPTION PLATFORM</div>
            </div>
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '24px' }}>
              {[
                { label: 'Total Events', value: stats?.total_events ?? 0, color: '#a78bfa' },
                { label: 'High Risk', value: stats?.high_risk_events ?? 0, color: '#ff4d6d' },
                { label: 'Countries', value: stats?.unique_countries?.length ?? 0, color: '#38bdf8' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: 900, lineHeight: 1 }}>
                    <AnimatedNumber value={s.value} color={s.color} />
                  </div>
                  <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '1.5px', marginTop: '2px' }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(6,255,165,0.08)', border: '1px solid rgba(6,255,165,0.2)', borderRadius: '20px', padding: '6px 14px' }}>
              <span style={{ position: 'relative', display: 'inline-flex', width: '8px', height: '8px' }}>
                <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#06ffa5', animation: 'ping 1.5s infinite' }} />
                <span style={{ position: 'relative', width: '8px', height: '8px', borderRadius: '50%', background: '#06ffa5', boxShadow: '0 0 8px #06ffa5' }} />
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#06ffa5', letterSpacing: '1px' }}>LIVE</span>
            </div>
          </div>
        </nav>

        <div style={{ position: 'relative', zIndex: 10, padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', height: 'calc(100vh - 73px)' }}>

          {/* Left — Attack Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}>

            {/* Section header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #7c3aed, #0ea5e9)', borderRadius: '2px' }} />
                <span style={{ fontWeight: 700, fontSize: '14px', color: '#e2e8f0' }}>Live Attack Feed</span>
              </div>
              <div style={{ fontSize: '11px', color: '#334155', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 12px', borderRadius: '20px' }}>
                auto-refresh 15s
              </div>
            </div>

            {/* Event cards */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
              {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#334155', fontSize: '13px' }}>
                  <span style={{ animation: 'pulse 1.5s infinite' }}>Initializing threat detection...</span>
                </div>
              ) : events.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: '#1e293b' }}>
                  <Eye size={40} strokeWidth={1} />
                  <span style={{ fontSize: '13px' }}>Honeypots deployed. Waiting for attackers...</span>
                </div>
              ) : events.map((event, idx) => {
                const risk = getRisk(event.risk_score)
                const isSelected = selected?.id === event.id
                const isNew = newIds.has(event.id)
                return (
                  <div
                    key={event.id}
                    className="ecard"
                    onClick={() => setSelected(isSelected ? null : event)}
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, rgba(124,58,237,0.12), rgba(14,165,233,0.08))`
                        : 'rgba(255,255,255,0.03)',
                      backdropFilter: 'blur(12px)',
                      border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : isNew ? risk.color + '50' : 'rgba(255,255,255,0.06)'}`,
                      borderLeft: `3px solid ${risk.color}`,
                      borderRadius: '14px',
                      padding: '16px 18px',
                      cursor: 'pointer',
                      animation: isNew ? `slideRight 0.4s ease` : `fadeUp 0.3s ease ${idx * 0.03}s both`,
                      boxShadow: isSelected ? `0 8px 32px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)` : isNew ? `0 0 24px ${risk.color}20` : '0 2px 8px rgba(0,0,0,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: risk.color, boxShadow: `0 0 10px ${risk.color}`, flexShrink: 0, marginTop: '3px' }} />
                        <div>
                          <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#94a3b8', letterSpacing: '0.5px' }}>{event.ip}</div>
                          <div style={{ fontSize: '12px', color: '#334155', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={10} />{event.country || 'Unknown'}{event.city ? ` · ${event.city}` : ''}
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: risk.color, background: risk.dim, border: `1px solid ${risk.color}40`, padding: '3px 10px', borderRadius: '20px', letterSpacing: '1px' }}>
                          {risk.label}
                        </span>
                        <span style={{ fontSize: '10px', color: '#334155' }}>{timeAgo(event.created_at)}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1', textTransform: 'capitalize' }}>
                        {event.event_type.replace(/_/g, ' ')}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '80px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ width: `${event.risk_score}%`, height: '100%', background: `linear-gradient(90deg, ${risk.color}80, ${risk.color})`, borderRadius: '2px', boxShadow: `0 0 8px ${risk.color}` }} />
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: risk.color, fontFamily: 'monospace' }}>{event.risk_score}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px' }}>
                        <Terminal size={9} />{event.honeypot_type}
                      </span>
                      {event.commands?.length > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#334155', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px' }}>
                          <Zap size={9} />{event.commands.length} commands
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right — Detail Panel */}
          <div style={{ background: 'rgba(255,255,255,0.02)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '3px', height: '20px', background: 'linear-gradient(180deg, #7c3aed, #0ea5e9)', borderRadius: '2px' }} />
              <span style={{ fontWeight: 700, fontSize: '14px' }}>Threat Intelligence</span>
            </div>

            {!selected ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#1e293b', padding: '40px 0' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lock size={28} strokeWidth={1} color="#7c3aed40" />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: '#1e293b', marginBottom: '4px' }}>No threat selected</div>
                  <div style={{ fontSize: '11px', color: '#0f172a' }}>Click an event to investigate</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', animation: 'fadeUp 0.3s ease' }}>

                {/* IP Hero */}
                <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(14,165,233,0.08))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ fontSize: '10px', color: '#475569', letterSpacing: '2px', marginBottom: '6px' }}>TARGET IP</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{selected.ip}</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={11} />{[selected.country, selected.city].filter(Boolean).join(' · ') || 'Unknown location'}
                  </div>
                </div>

                {/* Info grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {[
                    { icon: <Wifi size={12} />, label: 'ISP', value: selected.isp },
                    { icon: <Terminal size={12} />, label: 'Honeypot', value: selected.honeypot_type },
                    { icon: <Activity size={12} />, label: 'Event Type', value: selected.event_type.replace(/_/g, ' ') },
                    { icon: <AlertTriangle size={12} />, label: 'Risk Score', value: `${selected.risk_score} / 100` },
                  ].map(item => (
                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#334155', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                        {item.icon}{item.label}
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value || '—'}</div>
                    </div>
                  ))}
                </div>

                {/* Risk bar */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', color: '#334155', fontWeight: 700, letterSpacing: '1px' }}>THREAT LEVEL</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: getRisk(selected.risk_score).color }}>{getRisk(selected.risk_score).label}</span>
                  </div>
                  <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${selected.risk_score}%`, height: '100%', background: `linear-gradient(90deg, ${getRisk(selected.risk_score).color}60, ${getRisk(selected.risk_score).color})`, borderRadius: '3px', boxShadow: `0 0 12px ${getRisk(selected.risk_score).color}`, transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                {/* Commands */}
                {selected.commands?.length > 0 && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '10px', color: '#334155', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Terminal size={10} />COMMANDS INTERCEPTED
                    </div>
                    {selected.commands.map((cmd, i) => (
                      <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#06ffa5', marginBottom: '6px', display: 'flex', gap: '8px', animation: `slideRight 0.3s ease ${i * 0.08}s both` }}>
                        <span style={{ color: '#334155' }}>$</span>{cmd}
                      </div>
                    ))}
                  </div>
                )}

                {/* AI Summary */}
                {selected.ai_summary && (
                  <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(14,165,233,0.05))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '10px', padding: '14px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={10} color="#a78bfa" />
                      <span style={{ color: '#334155' }}>AI ANALYSIS</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}