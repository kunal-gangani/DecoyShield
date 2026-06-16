'use client'

import { useEffect, useState, useRef } from 'react'
import { getEvents, getStats } from '../lib/api'
import { Shield, AlertTriangle, Globe, Activity, Terminal, MapPin, Wifi, Zap, Radio, Grid, Eye, Code } from 'lucide-react'

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
  if (score >= 90) return { label: 'CRITICAL', color: '#ef4444', dim: '#ef444415' }
  if (score >= 70) return { label: 'HIGH', color: '#f97316', dim: '#f9731615' }
  if (score >= 40) return { label: 'MEDIUM', color: '#eab308', dim: '#eab30815' }
  return { label: 'LOW', color: '#22c55e', dim: '#22c55e15' }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 800
    const step = Math.max(1, Math.ceil(value / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

// ─── THEME 1: WAR ROOM ───────────────────────────────────────────────────────
function WarRoom({ events, stats, selected, setSelected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const angle = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = Math.min(cx, cy) - 10

    function draw() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Rings
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath()
        ctx.arc(cx, cy, (r / 4) * i, 0, Math.PI * 2)
        ctx.strokeStyle = '#00ff8810'
        ctx.lineWidth = 1
        ctx.stroke()
      }
      // Cross lines
      ctx.strokeStyle = '#00ff8808'
      ctx.beginPath(); ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke()
      // Sweep
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(angle.current)
      const sweep = ctx.createLinearGradient(0, -r, 0, 0)
      sweep.addColorStop(0, '#00ff8840')
      sweep.addColorStop(1, 'transparent')
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + 1.2)
      ctx.fillStyle = '#00ff8808'
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(0, -r)
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 1.5
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 8
      ctx.stroke()
      ctx.restore()
      // Blips
      events.slice(0, 8).forEach((e: Event, i: number) => {
        const risk = getRisk(e.risk_score)
        const a = (i / 8) * Math.PI * 2
        const d = r * (0.3 + (e.risk_score / 100) * 0.6)
        const x = cx + Math.cos(a) * d
        const y = cy + Math.sin(a) * d
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2)
        ctx.fillStyle = risk.color
        ctx.shadowColor = risk.color
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
      })
      angle.current += 0.008
      requestAnimationFrame(draw)
    }
    draw()
  }, [events])

  return (
    <div style={{ minHeight: '100vh', background: '#020804', color: '#00ff88', fontFamily: 'monospace' }}>
      <style>{`
        @keyframes scanH { from{transform:translateY(-100%)} to{transform:translateY(100vh)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      {/* CRT scanlines */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #00000015 2px, #00000015 4px)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'linear-gradient(transparent, #00ff8820, transparent)', animation: 'scanH 4s linear infinite', zIndex: 1, pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid #00ff8820', padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '16px', background: '#020804' }}>
        <span style={{ color: '#00ff88', fontWeight: 900, fontSize: '20px', letterSpacing: '4px', textShadow: '0 0 20px #00ff88' }}>DECOYSHIELD</span>
        <span style={{ color: '#00ff8840' }}>|</span>
        <span style={{ color: '#00ff8880', fontSize: '12px', letterSpacing: '2px' }}>THREAT OPERATIONS CENTER</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', fontSize: '12px' }}>
          {[
            { label: 'EVENTS', value: stats?.total_events ?? 0, color: '#00ff88' },
            { label: 'HIGH RISK', value: stats?.high_risk_events ?? 0, color: '#ef4444' },
            { label: 'NATIONS', value: stats?.unique_countries?.length ?? 0, color: '#60a5fa' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: '20px', fontWeight: 900, textShadow: `0 0 10px ${s.color}` }}><AnimatedNumber value={s.value} /></div>
              <div style={{ color: '#00ff8840', fontSize: '9px', letterSpacing: '2px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px 340px', gap: '0', height: 'calc(100vh - 57px)' }}>
        {/* Radar */}
        <div style={{ borderRight: '1px solid #00ff8815', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '10px', color: '#00ff8840', letterSpacing: '3px', marginBottom: '16px' }}>RADAR SWEEP</div>
          <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '360px', aspectRatio: '1', border: '1px solid #00ff8815', borderRadius: '50%' }} />
          <div style={{ marginTop: '16px', fontSize: '10px', color: '#00ff8840', letterSpacing: '2px', animation: 'blink 1.5s infinite' }}>● SCANNING</div>
        </div>

        {/* Attack Log */}
        <div style={{ borderRight: '1px solid #00ff8815', padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', color: '#00ff8840', letterSpacing: '3px', marginBottom: '12px' }}>THREAT LOG</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {events.length === 0 ? (
              <div style={{ color: '#00ff8830', fontSize: '12px', textAlign: 'center', paddingTop: '40px' }}>awaiting contact...</div>
            ) : events.map((e: Event) => {
              const risk = getRisk(e.risk_score)
              return (
                <div key={e.id} onClick={() => setSelected(e)} style={{ borderLeft: `2px solid ${risk.color}`, paddingLeft: '10px', cursor: 'pointer', opacity: selected?.id === e.id ? 1 : 0.7, background: selected?.id === e.id ? risk.dim : 'transparent', borderRadius: '0 4px 4px 0', padding: '8px 10px', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ color: risk.color, fontSize: '10px', fontWeight: 700 }}>{risk.label}</span>
                    <span style={{ color: '#00ff8840', fontSize: '10px' }}>{timeAgo(e.created_at)}</span>
                  </div>
                  <div style={{ color: '#00ff88', fontSize: '12px' }}>{e.ip}</div>
                  <div style={{ color: '#00ff8860', fontSize: '11px' }}>{e.event_type.replace(/_/g, ' ')}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Detail */}
        <div style={{ padding: '16px', overflowY: 'auto' }}>
          <div style={{ fontSize: '10px', color: '#00ff8840', letterSpacing: '3px', marginBottom: '12px' }}>THREAT DOSSIER</div>
          {!selected ? (
            <div style={{ color: '#00ff8820', fontSize: '12px', paddingTop: '40px', textAlign: 'center' }}>select target to analyze</div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {[
                ['TARGET IP', selected.ip],
                ['ORIGIN', selected.country || 'UNKNOWN'],
                ['CITY', selected.city || 'UNKNOWN'],
                ['CARRIER', selected.isp || 'UNKNOWN'],
                ['VECTOR', selected.honeypot_type.toUpperCase()],
                ['THREAT LVL', `${selected.risk_score}/100`],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: '10px', borderBottom: '1px solid #00ff8810', paddingBottom: '10px' }}>
                  <div style={{ color: '#00ff8840', fontSize: '9px', letterSpacing: '3px', marginBottom: '2px' }}>{k}</div>
                  <div style={{ color: '#00ff88', fontSize: '13px' }}>{v}</div>
                </div>
              ))}
              {selected.commands?.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ color: '#00ff8840', fontSize: '9px', letterSpacing: '3px', marginBottom: '8px' }}>COMMANDS INTERCEPTED</div>
                  {selected.commands.map((c: string, i: number) => (
                    <div key={i} style={{ color: '#ef4444', fontSize: '12px', marginBottom: '4px' }}>{'>'} {c}</div>
                  ))}
                </div>
              )}
              {selected.ai_summary && (
                <div style={{ marginTop: '12px', background: '#00ff8808', border: '1px solid #00ff8820', borderRadius: '6px', padding: '12px' }}>
                  <div style={{ color: '#00ff8840', fontSize: '9px', letterSpacing: '3px', marginBottom: '8px' }}>AI ANALYSIS</div>
                  <div style={{ color: '#00ff8890', fontSize: '12px', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME 2: DARK OPS ───────────────────────────────────────────────────────
function DarkOps({ events, stats, selected, setSelected }: any) {
  const [log, setLog] = useState<string[]>([])
  useEffect(() => {
    const lines = events.slice(0, 20).map((e: Event) => {
      const risk = getRisk(e.risk_score)
      return `[${new Date(e.created_at).toLocaleTimeString()}] ${risk.label.padEnd(8)} ${e.ip.padEnd(18)} ${e.event_type.replace(/_/g, '-')} // ${e.country || 'UNKNOWN'}`
    })
    setLog(lines)
  }, [events])

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '13px' }}>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
      <div style={{ borderBottom: '1px solid #21262d', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: '#0d1117' }}>
        <span style={{ color: '#58a6ff', fontWeight: 700, letterSpacing: '2px' }}>DECOYSHIELD</span>
        <span style={{ color: '#21262d' }}>|</span>
        <span style={{ color: '#3d444d', fontSize: '11px' }}>dark ops terminal v1.0</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', fontSize: '12px' }}>
          <span style={{ color: '#3d444d' }}>events: <span style={{ color: '#58a6ff' }}>{stats?.total_events ?? 0}</span></span>
          <span style={{ color: '#3d444d' }}>critical: <span style={{ color: '#f85149' }}>{stats?.high_risk_events ?? 0}</span></span>
          <span style={{ color: '#3d444d' }}>nations: <span style={{ color: '#3fb950' }}>{stats?.unique_countries?.length ?? 0}</span></span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 41px)' }}>
        <div style={{ padding: '20px', overflowY: 'auto', borderRight: '1px solid #21262d' }}>
          <div style={{ color: '#3d444d', marginBottom: '16px', fontSize: '11px' }}>// live threat feed — {events.length} events captured</div>
          {log.length === 0 ? (
            <div style={{ color: '#3d444d' }}>awaiting threats<span style={{ animation: 'blink 1s infinite' }}>_</span></div>
          ) : log.map((line, i) => {
            const e = events[i]
            const risk = getRisk(e?.risk_score ?? 0)
            return (
              <div key={i} onClick={() => setSelected(e)} style={{ padding: '6px 8px', borderRadius: '4px', cursor: 'pointer', marginBottom: '2px', background: selected?.id === e?.id ? '#161b22' : 'transparent', borderLeft: `2px solid ${selected?.id === e?.id ? risk.color : 'transparent'}`, transition: 'all 0.1s' }}>
                <span style={{ color: '#3d444d' }}>{line.split(']')[0]}]</span>
                <span style={{ color: risk.color, fontWeight: 700 }}> {getRisk(e?.risk_score ?? 0).label.padEnd(8)}</span>
                <span style={{ color: '#58a6ff' }}> {e?.ip?.padEnd(18)}</span>
                <span style={{ color: '#c9d1d9' }}> {e?.event_type?.replace(/_/g, '-')}</span>
                <span style={{ color: '#3d444d' }}> // {e?.country || 'UNKNOWN'}</span>
              </div>
            )
          })}
          <div style={{ color: '#3d444d', marginTop: '8px', animation: 'blink 1s infinite' }}>█</div>
        </div>
        <div style={{ padding: '20px', overflowY: 'auto', background: '#0d1117' }}>
          {!selected ? (
            <div style={{ color: '#3d444d', paddingTop: '40px' }}>
              <div>{'>'} select a threat to analyze</div>
              <div style={{ animation: 'blink 1s infinite' }}>_</div>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.2s ease' }}>
              <div style={{ color: '#3d444d', marginBottom: '16px' }}>{'>'} analyzing {selected.ip}...</div>
              {[
                ['ip', selected.ip],
                ['country', selected.country],
                ['city', selected.city],
                ['isp', selected.isp],
                ['vector', selected.honeypot_type],
                ['risk_score', `${selected.risk_score}/100`],
                ['event_type', selected.event_type],
              ].map(([k, v]) => (
                <div key={k} style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#3d444d' }}>{k}: </span>
                  <span style={{ color: '#c9d1d9' }}>{v || 'null'}</span>
                </div>
              ))}
              {selected.commands?.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ color: '#3d444d', marginBottom: '8px' }}>commands_intercepted:</div>
                  {selected.commands.map((c: string, i: number) => (
                    <div key={i} style={{ color: '#f85149', marginBottom: '4px', paddingLeft: '12px' }}>{'>'} {c}</div>
                  ))}
                </div>
              )}
              {selected.ai_summary && (
                <div style={{ marginTop: '16px', borderTop: '1px solid #21262d', paddingTop: '16px' }}>
                  <div style={{ color: '#3d444d', marginBottom: '8px' }}>ai_analysis:</div>
                  <div style={{ color: '#8b949e', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME 3: THREAT MATRIX ──────────────────────────────────────────────────
function ThreatMatrix({ events, stats, selected, setSelected }: any) {
  return (
    <div style={{ minHeight: '100vh', background: '#03060d', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .mrow:hover{background:#0f172a!important}
      `}</style>
      <div style={{ background: '#060d1a', borderBottom: '1px solid #0f2040', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={22} color="#3b82f6" />
          <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '1px', color: '#e2e8f0' }}>DECOYSHIELD</span>
          <span style={{ background: '#1e3a5f', color: '#60a5fa', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', letterSpacing: '1px' }}>THREAT MATRIX</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '32px' }}>
          {[
            { label: 'TOTAL', value: stats?.total_events ?? 0, color: '#60a5fa' },
            { label: 'HIGH RISK', value: stats?.high_risk_events ?? 0, color: '#ef4444' },
            { label: 'COUNTRIES', value: stats?.unique_countries?.length ?? 0, color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: s.color, lineHeight: 1 }}><AnimatedNumber value={s.value} /></div>
              <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', fontWeight: 700 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', height: 'calc(100vh - 57px)' }}>
        <div style={{ overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#060d1a', borderBottom: '1px solid #0f2040' }}>
                {['RISK', 'IP ADDRESS', 'EVENT TYPE', 'HONEYPOT', 'COUNTRY', 'SCORE', 'TIME'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: '#334155', fontWeight: 700, letterSpacing: '1.5px', fontSize: '10px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: '#1e2733' }}>No events captured yet</td></tr>
              ) : events.map((e: Event) => {
                const risk = getRisk(e.risk_score)
                const isSelected = selected?.id === e.id
                return (
                  <tr key={e.id} className="mrow" onClick={() => setSelected(e)} style={{ borderBottom: '1px solid #0a1628', cursor: 'pointer', background: isSelected ? '#0f172a' : 'transparent', animation: 'fadeIn 0.3s ease' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: risk.color, background: risk.dim, border: `1px solid ${risk.color}30`, padding: '3px 8px', borderRadius: '4px', letterSpacing: '0.5px' }}>{risk.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#94a3b8' }}>{e.ip}</td>
                    <td style={{ padding: '12px 16px', color: '#e2e8f0', textTransform: 'capitalize' }}>{e.event_type.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '12px 16px', color: '#475569', fontFamily: 'monospace', fontSize: '11px' }}>{e.honeypot_type}</td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{e.country || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#0f2040', borderRadius: '2px', minWidth: '60px' }}>
                          <div style={{ width: `${e.risk_score}%`, height: '100%', background: risk.color, borderRadius: '2px', boxShadow: `0 0 6px ${risk.color}` }} />
                        </div>
                        <span style={{ color: risk.color, fontFamily: 'monospace', fontSize: '11px', fontWeight: 700 }}>{e.risk_score}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155', fontSize: '11px', whiteSpace: 'nowrap' }}>{timeAgo(e.created_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div style={{ background: '#060d1a', borderLeft: '1px solid #0f2040', padding: '20px', overflowY: 'auto' }}>
          {!selected ? (
            <div style={{ paddingTop: '80px', textAlign: 'center', color: '#1e2733' }}>
              <Grid size={32} style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: '13px' }}>Select a row to inspect</div>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #0f2040' }}>
                <div style={{ fontSize: '11px', color: '#334155', letterSpacing: '2px', marginBottom: '6px' }}>THREAT PROFILE</div>
                <div style={{ fontSize: '20px', fontFamily: 'monospace', color: '#e2e8f0', fontWeight: 700 }}>{selected.ip}</div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{selected.country} · {selected.city}</div>
              </div>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                {[
                  { label: 'ISP', value: selected.isp },
                  { label: 'HONEYPOT', value: selected.honeypot_type },
                  { label: 'EVENT', value: selected.event_type.replace(/_/g, ' ') },
                  { label: 'RISK SCORE', value: `${selected.risk_score} / 100` },
                ].map(item => (
                  <div key={item.label} style={{ background: '#03060d', border: '1px solid #0f2040', borderRadius: '8px', padding: '10px 14px' }}>
                    <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginBottom: '4px' }}>{item.label}</div>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>
              {selected.commands?.length > 0 && (
                <div style={{ background: '#03060d', border: '1px solid #0f2040', borderRadius: '8px', padding: '14px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginBottom: '10px' }}>COMMANDS</div>
                  {selected.commands.map((c: string, i: number) => (
                    <div key={i} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#ef4444', marginBottom: '4px' }}>$ {c}</div>
                  ))}
                </div>
              )}
              {selected.ai_summary && (
                <div style={{ background: '#03060d', border: '1px solid #0f2040', borderRadius: '8px', padding: '14px' }}>
                  <div style={{ fontSize: '9px', color: '#334155', letterSpacing: '2px', marginBottom: '10px' }}>AI ANALYSIS</div>
                  <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── THEME 4: NETWORK MAP ─────────────────────────────────────────────────────
function NetworkMap({ events, stats, selected, setSelected }: any) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const nodes = events.slice(0, 12).map((e: Event, i: number) => {
      const angle = (i / Math.min(events.length, 12)) * Math.PI * 2
      const dist = 120 + Math.random() * 80
      return { x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist, event: e, pulse: Math.random() * Math.PI * 2 }
    })
    let t = 0

    function draw() {
      if (!canvas) return
      const ctx = canvas.getContext('2d')!
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Lines from center
      nodes.forEach((n: { x: number; y: number; event: Event; pulse: number }) => {
        const risk = getRisk(n.event.risk_score)
        ctx.beginPath()
        ctx.moveTo(cx, cy)
        ctx.lineTo(n.x, n.y)
        ctx.strokeStyle = risk.color + '30'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        ctx.stroke()
        ctx.setLineDash([])
      })
      // Center node
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.fillStyle = '#00ff8820'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(cx, cy, 16, 0, Math.PI * 2)
      ctx.strokeStyle = '#00ff88'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00ff88'
      ctx.shadowBlur = 20
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.fillStyle = '#00ff88'
      ctx.font = '9px monospace'
      ctx.textAlign = 'center'
      ctx.fillText('YOU', cx, cy + 4)
      // Attacker nodes
      nodes.forEach((n: { x: number; y: number; event: Event; pulse: number }) => {
        const risk = getRisk(n.event.risk_score)
        const pulse = Math.sin(t + n.pulse) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(n.x, n.y, 10 * pulse, 0, Math.PI * 2)
        ctx.fillStyle = risk.color + '20'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, 8, 0, Math.PI * 2)
        ctx.fillStyle = risk.color + '40'
        ctx.fill()
        ctx.beginPath()
        ctx.arc(n.x, n.y, 5, 0, Math.PI * 2)
        ctx.fillStyle = risk.color
        ctx.shadowColor = risk.color
        ctx.shadowBlur = 12
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#94a3b8'
        ctx.font = '9px monospace'
        ctx.textAlign = 'center'
        ctx.fillText(n.event.ip, n.x, n.y + 20)
      })
      t += 0.02
      requestAnimationFrame(draw)
    }
    draw()
  }, [events])

  return (
    <div style={{ minHeight: '100vh', background: '#060b14', color: '#e2e8f0', fontFamily: 'Inter, sans-serif' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ background: '#080f1e', borderBottom: '1px solid #0f2040', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Wifi size={20} color="#3b82f6" />
        <span style={{ fontWeight: 800, letterSpacing: '1px' }}>DECOYSHIELD</span>
        <span style={{ color: '#1e3a5f', fontSize: '13px' }}>Network Map</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '24px', fontSize: '12px' }}>
          <span style={{ color: '#475569' }}>Events: <span style={{ color: '#60a5fa', fontWeight: 700 }}>{stats?.total_events ?? 0}</span></span>
          <span style={{ color: '#475569' }}>High Risk: <span style={{ color: '#ef4444', fontWeight: 700 }}>{stats?.high_risk_events ?? 0}</span></span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', height: 'calc(100vh - 57px)' }}>
        <div style={{ position: 'relative' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
          <div style={{ position: 'absolute', bottom: '20px', left: '20px', display: 'flex', gap: '16px', fontSize: '11px' }}>
            {[['CRITICAL', '#ef4444'], ['HIGH', '#f97316'], ['MEDIUM', '#eab308'], ['LOW', '#22c55e']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c, boxShadow: `0 0 6px ${c}` }} />
                <span style={{ color: '#475569' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background: '#080f1e', borderLeft: '1px solid #0f2040', overflowY: 'auto' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #0f2040', fontSize: '10px', color: '#334155', letterSpacing: '2px', fontWeight: 700 }}>ATTACK NODES</div>
          <div style={{ padding: '8px' }}>
            {events.length === 0 ? (
              <div style={{ color: '#1e2733', fontSize: '13px', textAlign: 'center', padding: '40px 0' }}>No nodes detected</div>
            ) : events.map((e: Event) => {
              const risk = getRisk(e.risk_score)
              return (
                <div key={e.id} onClick={() => setSelected(selected?.id === e.id ? null : e)} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px', background: selected?.id === e.id ? '#0f172a' : 'transparent', border: `1px solid ${selected?.id === e.id ? risk.color + '40' : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: risk.color, boxShadow: `0 0 6px ${risk.color}`, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#94a3b8' }}>{e.ip}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: risk.color, fontWeight: 700 }}>{e.risk_score}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', paddingLeft: '16px' }}>{e.event_type.replace(/_/g, ' ')} · {e.country || 'Unknown'}</div>
                  {selected?.id === e.id && e.ai_summary && (
                    <div style={{ marginTop: '10px', paddingLeft: '16px', borderTop: '1px solid #0f2040', paddingTop: '10px', animation: 'fadeIn 0.3s ease' }}>
                      <div style={{ fontSize: '10px', color: '#334155', letterSpacing: '2px', marginBottom: '6px' }}>AI ANALYSIS</div>
                      <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line' }}>{e.ai_summary}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
type Theme = 'warroom' | 'darkops' | 'matrix' | 'network'

export default function Dashboard() {
  const [events, setEvents] = useState<Event[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<Event | null>(null)
  const [theme, setTheme] = useState<Theme>('warroom')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [eventsData, statsData] = await Promise.all([getEvents(), getStats()])
      setEvents(eventsData)
      setStats(statsData)
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [])

  const themes: { id: Theme; label: string; icon: any }[] = [
    { id: 'warroom', label: 'War Room', icon: <Radio size={13} /> },
    { id: 'darkops', label: 'Dark Ops', icon: <Code size={13} /> },
    { id: 'matrix', label: 'Threat Matrix', icon: <Grid size={13} /> },
    { id: 'network', label: 'Network Map', icon: <Wifi size={13} /> },
  ]

  const switcher = (
    <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000, background: '#0d1117', border: '1px solid #1e2733', borderRadius: '12px', padding: '6px', display: 'flex', gap: '4px', boxShadow: '0 8px 32px #00000080' }}>
      {themes.map(t => (
        <button key={t.id} onClick={() => { setSelected(null); setTheme(t.id) }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: theme === t.id ? '#1e2733' : 'transparent', color: theme === t.id ? '#e2e8f0' : '#475569', transition: 'all 0.15s' }}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  )

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#080b0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00ff88', fontFamily: 'monospace', fontSize: '14px' }}>
      initializing decoyshield...
    </div>
  )

  const props = { events, stats, selected, setSelected }

  return (
    <>
      {theme === 'warroom' && <WarRoom {...props} />}
      {theme === 'darkops' && <DarkOps {...props} />}
      {theme === 'matrix' && <ThreatMatrix {...props} />}
      {theme === 'network' && <NetworkMap {...props} />}
      {switcher}
    </>
  )
}