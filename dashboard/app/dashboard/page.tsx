'use client'

import { useEffect, useState } from 'react'
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

function getRisk(score: number) {
    if (score >= 90) return { label: 'CRITICAL', color: '#ff4d6d', glow: '255,77,109', bg: 'rgba(255,77,109,0.08)', border: 'rgba(255,77,109,0.25)' }
    if (score >= 70) return { label: 'HIGH', color: '#ff6b35', glow: '255,107,53', bg: 'rgba(255,107,53,0.08)', border: 'rgba(255,107,53,0.25)' }
    if (score >= 40) return { label: 'MEDIUM', color: '#ffd60a', glow: '255,214,10', bg: 'rgba(255,214,10,0.08)', border: 'rgba(255,214,10,0.25)' }
    return { label: 'LOW', color: '#06ffa5', glow: '6,255,165', bg: 'rgba(6,255,165,0.08)', border: 'rgba(6,255,165,0.25)' }
}

function timeAgo(d: string) {
    const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
}

export default function Dashboard() {
    const [events, setEvents] = useState<Event[]>([])
    const [stats, setStats] = useState<Stats | null>(null)
    const [selected, setSelected] = useState<Event | null>(null)
    const [filter, setFilter] = useState<string>('ALL')
    const router = useRouter()

    useEffect(() => {
        async function load() {
            const [eventsData, statsData] = await Promise.all([getEvents(), getStats()])
            setEvents(eventsData)
            setStats(statsData)
        }
        load()
        const iv = setInterval(load, 15000)
        return () => clearInterval(iv)
    }, [])

    const filtered = filter === 'ALL' ? events : events.filter(e => getRisk(e.risk_score).label === filter)
    const risk = selected ? getRisk(selected.risk_score) : null

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Inter', sans-serif; }
        body { background: #050505; overflow: hidden; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideRight { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        .tr { transition: all 0.15s ease; cursor: pointer; }
        .tr:hover td { background: rgba(124,58,237,0.06) !important; }
        .filter-btn { transition: all 0.2s ease; cursor: pointer; border: none; }
        .filter-btn:hover { transform: translateY(-1px); }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(124,58,237,0.3); border-radius: 3px; }
      `}</style>

            <div style={{ background: '#050505', color: '#e2e8f0', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

                {/* Background orbs */}
                <div style={{ position: 'fixed', top: '-150px', right: '-100px', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
                <div style={{ position: 'fixed', bottom: '-100px', left: '300px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(14,165,233,0.04) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

                {/* TOP NAV */}
                <nav style={{ position: 'relative', zIndex: 100, background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(20px)', borderBottom: '0.5px solid rgba(255,255,255,0.06)', padding: '0 32px', display: 'flex', alignItems: 'center', height: '56px', gap: '24px', flexShrink: 0 }}>

                    {/* Logo */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingRight: '24px', borderRight: '0.5px solid rgba(255,255,255,0.06)' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 14px rgba(124,58,237,0.5)', flexShrink: 0 }}>
                            <svg width="16" height="16" viewBox="0 0 36 36" fill="none">
                                <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="white" strokeWidth="2.5" />
                                <circle cx="18" cy="18" r="4" fill="white" />
                            </svg>
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '1.5px' }}>DECOYSHIELD</div>
                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px' }}>THREAT OPERATIONS</div>
                        </div>
                    </div>

                    {/* Nav links */}
                    <div style={{ display: 'flex', gap: '4px' }}>
                        {[
                            { label: 'Overview', active: true },
                            { label: 'Honeypots', active: false },
                            { label: 'Intelligence', active: false },
                            { label: 'Reports', active: false },
                        ].map(item => (
                            <div key={item.label} style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: item.active ? 600 : 400, color: item.active ? '#a78bfa' : 'rgba(255,255,255,0.3)', background: item.active ? 'rgba(124,58,237,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                                onMouseEnter={e => { if (!item.active) e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
                                onMouseLeave={e => { if (!item.active) e.currentTarget.style.color = 'rgba(255,255,255,0.3)' }}
                            >{item.label}</div>
                        ))}
                    </div>

                    {/* Right side */}
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(6,255,165,0.08)', border: '0.5px solid rgba(6,255,165,0.2)', borderRadius: '20px', padding: '4px 12px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06ffa5', display: 'inline-block', boxShadow: '0 0 8px #06ffa5', animation: 'pulse 1.5s infinite' }} />
                            <span style={{ fontSize: '10px', color: '#06ffa5', fontWeight: 600, letterSpacing: '1px' }}>LIVE</span>
                        </div>
                        <button
                            onClick={() => router.push('/')}
                            style={{ background: 'rgba(124,58,237,0.08)', border: '0.5px solid rgba(124,58,237,0.2)', borderRadius: '20px', padding: '6px 16px', color: '#a78bfa', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
                        >← Home</button>
                    </div>
                </nav>

                {/* STAT CARDS */}
                <div style={{ position: 'relative', zIndex: 10, padding: '20px 32px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', flexShrink: 0 }}>
                    {[
                        { label: 'Total Events', value: stats?.total_events ?? 0, color: '#a78bfa', sub: 'all honeypots', icon: '◎' },
                        { label: 'High Risk', value: stats?.high_risk_events ?? 0, color: '#ff4d6d', sub: 'score ≥ 70', icon: '⚠' },
                        { label: 'Nations', value: stats?.unique_countries?.length ?? 0, color: '#38bdf8', sub: 'unique origins', icon: '◈' },
                        { label: 'Active Traps', value: 3, color: '#06ffa5', sub: 'honeypots live', icon: '⬡' },
                    ].map((s, i) => (
                        <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '16px 20px', position: 'relative', overflow: 'hidden', animation: `fadeIn 0.4s ease ${i * 0.08}s both` }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '60px', height: '60px', background: `radial-gradient(circle, rgba(${s.color === '#a78bfa' ? '167,139,250' : s.color === '#ff4d6d' ? '255,77,109' : s.color === '#38bdf8' ? '56,189,248' : '6,255,165'},0.12) 0%, transparent 70%)`, borderRadius: '0 14px 0 60px' }} />
                            <div style={{ fontSize: '20px', color: s.color, marginBottom: '8px', opacity: 0.6 }}>{s.icon}</div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-1px', marginBottom: '4px' }}>{s.value}</div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>{s.label}</div>
                            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)' }}>{s.sub}</div>
                        </div>
                    ))}
                </div>

                {/* MAIN CONTENT */}
                <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'grid', gridTemplateColumns: '1fr 360px', gap: '16px', padding: '16px 32px 24px', overflow: 'hidden', minHeight: 0 }}>

                    {/* LEFT — ATTACK TABLE */}
                    <div style={{ display: 'flex', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '16px', overflow: 'hidden' }}>

                        {/* Table header */}
                        <div style={{ padding: '14px 20px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aed, #0ea5e9)', borderRadius: '2px' }} />
                                <span style={{ fontSize: '12px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px' }}>Live Attack Feed</span>
                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '10px' }}>{events.length} events</span>
                            </div>

                            {/* Filters */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => {
                                    const isActive = filter === f
                                    const fRisk = f !== 'ALL' ? getRisk(f === 'CRITICAL' ? 95 : f === 'HIGH' ? 75 : f === 'MEDIUM' ? 50 : 20) : null
                                    return (
                                        <button
                                            key={f}
                                            className="filter-btn"
                                            onClick={() => setFilter(f)}
                                            style={{
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                letterSpacing: '0.5px',
                                                background: isActive ? (fRisk ? fRisk.bg : 'rgba(124,58,237,0.12)') : 'transparent',
                                                color: isActive ? (fRisk ? fRisk.color : '#a78bfa') : 'rgba(255,255,255,0.25)',
                                                border: `0.5px solid ${isActive ? (fRisk ? fRisk.border : 'rgba(124,58,237,0.3)') : 'transparent'}`,
                                            }}
                                        >{f}</button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Table */}
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: 'rgba(5,5,5,0.95)', zIndex: 10 }}>
                                    <tr>
                                        {['RISK', 'IP ADDRESS', 'EVENT TYPE', 'HONEYPOT', 'ORIGIN', 'SCORE', 'TIME'].map(h => (
                                            <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.2)', letterSpacing: '1.5px', borderBottom: '0.5px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.08)', fontSize: '13px' }}>
                                                {events.length === 0 ? 'No events yet. Honeypots are live and waiting...' : `No ${filter} events`}
                                            </td>
                                        </tr>
                                    ) : filtered.map((e, idx) => {
                                        const r = getRisk(e.risk_score)
                                        const isSelected = selected?.id === e.id
                                        return (
                                            <tr
                                                key={e.id}
                                                className="tr"
                                                onClick={() => setSelected(isSelected ? null : e)}
                                                style={{ background: isSelected ? `rgba(${r.glow},0.06)` : 'transparent', animation: `fadeIn 0.3s ease ${idx * 0.03}s both` }}
                                            >
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                                                    <span style={{ fontSize: '10px', fontWeight: 800, color: r.color, background: r.bg, border: `0.5px solid ${r.border}`, padding: '3px 8px', borderRadius: '6px', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>{r.label}</span>
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', fontFamily: 'monospace', fontSize: '12px', color: '#94a3b8', letterSpacing: '0.5px' }}>{e.ip}</td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', fontSize: '12px', color: '#e2e8f0', textTransform: 'capitalize' }}>{e.event_type.replace(/_/g, ' ')}</td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{e.honeypot_type}</td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{e.country || '—'}</td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '52px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${e.risk_score}%`, height: '100%', background: `linear-gradient(90deg, ${r.color}60, ${r.color})`, borderRadius: '2px' }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 700, color: r.color, fontFamily: 'monospace', minWidth: '24px' }}>{e.risk_score}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', fontSize: '11px', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>{timeAgo(e.created_at)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT — DETAIL PANEL */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden' }}>

                        {/* Threat detail */}
                        <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '18px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '0.5px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ width: '3px', height: '16px', background: 'linear-gradient(180deg, #7c3aed, #0ea5e9)', borderRadius: '2px' }} />
                                <span style={{ fontSize: '11px', fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px' }}>Threat Intelligence</span>
                            </div>

                            {!selected ? (
                                <div style={{ paddingTop: '40px', textAlign: 'center' }}>
                                    <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: 'rgba(124,58,237,0.06)', border: '0.5px solid rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                                        <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                                            <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="none" stroke="rgba(124,58,237,0.4)" strokeWidth="1.5" />
                                            <circle cx="18" cy="18" r="4" fill="rgba(124,58,237,0.4)" />
                                        </svg>
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', fontWeight: 500, marginBottom: '4px' }}>Select a row</div>
                                    <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.07)' }}>to view threat details</div>
                                </div>
                            ) : (
                                <div style={{ animation: 'slideRight 0.25s ease' }}>

                                    {/* IP hero */}
                                    <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(14,165,233,0.06))', border: '0.5px solid rgba(124,58,237,0.18)', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 700, marginBottom: '5px' }}>TARGET IP</div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, background: 'linear-gradient(135deg, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.5px', marginBottom: '4px', wordBreak: 'break-all' }}>{selected.ip}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '10px' }}>{[selected.country, selected.city].filter(Boolean).join(' · ') || 'Unknown'}</div>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: `rgba(${risk!.glow},0.1)`, border: `0.5px solid rgba(${risk!.glow},0.25)`, borderRadius: '20px', padding: '3px 10px' }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: risk!.color, display: 'inline-block', boxShadow: `0 0 5px ${risk!.color}` }} />
                                            <span style={{ fontSize: '9px', color: risk!.color, fontWeight: 700, letterSpacing: '1px' }}>{risk!.label} · {selected.risk_score}/100</span>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        {[
                                            { label: 'ISP', value: selected.isp },
                                            { label: 'Honeypot', value: selected.honeypot_type },
                                            { label: 'Event Type', value: selected.event_type.replace(/_/g, ' ') },
                                            { label: 'Time', value: timeAgo(selected.created_at) },
                                        ].map(item => (
                                            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid rgba(255,255,255,0.04)' }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', fontWeight: 600, letterSpacing: '0.5px' }}>{item.label}</span>
                                                <span style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'capitalize', fontWeight: 500, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>{item.value || '—'}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Score bar */}
                                    <div style={{ margin: '14px 0', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '0.5px solid rgba(255,255,255,0.04)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '1.5px' }}>THREAT SCORE</span>
                                            <span style={{ fontSize: '13px', fontWeight: 900, color: risk!.color }}>{selected.risk_score}</span>
                                        </div>
                                        <div style={{ height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                            <div style={{ width: `${selected.risk_score}%`, height: '100%', background: `linear-gradient(90deg, ${risk!.color}50, ${risk!.color})`, borderRadius: '3px', boxShadow: `0 0 10px ${risk!.color}60`, transition: 'width 0.8s ease' }} />
                                        </div>
                                    </div>

                                    {/* Commands */}
                                    {selected.commands?.length > 0 && (
                                        <div style={{ background: 'rgba(0,0,0,0.25)', border: '0.5px solid rgba(255,255,255,0.04)', borderRadius: '10px', padding: '12px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 700, marginBottom: '8px' }}>INTERCEPTED COMMANDS</div>
                                            {selected.commands.map((c, i) => (
                                                <div key={i} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4ade80', marginBottom: '4px', display: 'flex', gap: '8px' }}>
                                                    <span style={{ color: 'rgba(255,255,255,0.15)' }}>$</span>{c}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* AI Summary */}
                                    {selected.ai_summary && (
                                        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(14,165,233,0.03))', border: '0.5px solid rgba(124,58,237,0.12)', borderRadius: '10px', padding: '12px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><polygon points="13,2 3,14 12,14 11,22 21,10 12,10" fill="#a78bfa" /></svg>
                                                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.2)', letterSpacing: '2px', fontWeight: 700 }}>AI ANALYSIS</span>
                                            </div>
                                            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.9, whiteSpace: 'pre-line' }}>{selected.ai_summary}</div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Mini honeypot status */}
                        <div style={{ background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 18px', flexShrink: 0 }}>
                            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.2)', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '12px' }}>HONEYPOT STATUS</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {[
                                    { name: 'SSH Server', type: 'ssh', color: '#a78bfa', events: events.filter(e => e.honeypot_type === 'ssh').length },
                                    { name: 'Web Portal', type: 'web', color: '#38bdf8', events: events.filter(e => e.honeypot_type === 'web').length },
                                    { name: 'Fake API', type: 'api', color: '#06ffa5', events: events.filter(e => e.honeypot_type === 'api').length },
                                ].map(h => (
                                    <div key={h.type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: h.color, boxShadow: `0 0 6px ${h.color}`, flexShrink: 0 }} />
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', flex: 1 }}>{h.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '60px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                                                <div style={{ width: events.length > 0 ? `${(h.events / events.length) * 100}%` : '0%', height: '100%', background: h.color, borderRadius: '2px', opacity: 0.7 }} />
                                            </div>
                                            <span style={{ fontSize: '11px', color: h.color, fontWeight: 700, minWidth: '16px', textAlign: 'right' }}>{h.events}</span>
                                        </div>
                                        <span style={{ fontSize: '9px', color: 'rgba(6,255,165,0.6)', background: 'rgba(6,255,165,0.08)', padding: '2px 6px', borderRadius: '6px', fontWeight: 600 }}>LIVE</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}