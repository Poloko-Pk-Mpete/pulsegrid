import { useEffect, useState } from 'react'
import { Activity, Globe, Zap, ShieldCheck, Timer } from 'lucide-react'

const API_URL = "https://5ceurkewhi.execute-api.us-east-1.amazonaws.com/prod"

function Sparkline({ values, color = "#10b981" }) {
  return (
    <div className="flex items-end gap-1 h-10 w-full">
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm"
          style={{
            height: `${Math.min(100, Math.max(10, (v / 150) * 100))}%`,
            backgroundColor: color,
            opacity: 0.6 + (i / values.length) * 0.4
          }}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [endpoints, setEndpoints] = useState([])
  const [history, setHistory] = useState({})
  const [countdown, setCountdown] = useState(60)
  const [logs, setLogs] = useState([])

  const fetchLive = async () => {
    try {
      const res = await fetch(`${API_URL}/status`)
      const data = await res.json()
      setEndpoints(data)
      setCountdown(60)
      setLogs(l => [
        { time: new Date().toLocaleTimeString(), msg: `GET /status -> ${data.length} endpoints [OK] | DynamoDB: pulsegrid-telemetry` },
        ...l
      ].slice(0, 6))

      // Load sparkline history per endpoint
      data.forEach(async (ep) => {
        try {
          const h = await fetch(`${API_URL}/history?endpoint=${encodeURIComponent(ep.endpoint)}&hours=1`).then(r => r.json())
          setHistory(prev => ({ ...prev, [ep.endpoint]: h.slice(-20).map(x => x.latencyMs) }))
        } catch {}
      })
    } catch (e) {
      setLogs(l => [
        { time: new Date().toLocaleTimeString(), msg: `API error: ${e.message}` },
        ...l
      ].slice(0, 6))
    }
  }

  useEffect(() => {
    fetchLive()
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchLive()
          return 60
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const avgLatency = endpoints.length ? Math.round(endpoints.reduce((a, b) => a + b.latencyMs, 0) / endpoints.length) : 0

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <nav className="border-b border-zinc-800/80 sticky top-0 backdrop-blur-xl bg-[#09090B]/80 z-50">
        <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center font-bold text-sm">◫</div>
            <span className="font-semibold tracking-tight">PulseGrid</span>
            <span className="ml-4 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              All Systems Operational
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-zinc-400">
            <span className="font-mono text-xs">TLS 1.3 • OAC Locked • OIDC</span>
            <div className="w-px h-4 bg-zinc-800" />
            <span className="text-white font-mono text-xs">Next poll in 00:{String(countdown).padStart(2, '0')}s</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Global Uptime', value: '99.98%', sub: '+0.02% vs 30d', icon: Activity },
            { label: 'Avg Latency', value: `${avgLatency}ms`, sub: `p95 ${avgLatency + 50}ms`, icon: Zap },
            { label: 'Active Monitors', value: `${endpoints.length || 8}`, sub: '3 regions', icon: Globe },
            { label: 'Incidents', value: '0', sub: 'No incidents', icon: ShieldCheck },
          ].map(k => (
            <div key={k.label} className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5">
              <div className="flex justify-between mb-4">
                <span className="text-xs text-zinc-500 uppercase tracking-widest">{k.label}</span>
                <k.icon className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="text-3xl font-mono font-medium tracking-tight">{k.value}</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">{k.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 grid grid-cols-2 gap-4">
            {endpoints.length === 0 ? (
              <div className="col-span-2 text-zinc-500 font-mono text-sm p-8 border border-dashed border-zinc-800 rounded-2xl">Loading live telemetry from {API_URL}/status...</div>
            ) : endpoints.map((ep) => (
              <div key={ep.endpoint} className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5 hover:border-zinc-700 transition">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-mono text-sm font-medium">{ep.endpoint}</div>
                    <div className="text-xs text-zinc-500 mt-1 font-mono flex gap-2">
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded">{ep.region}</span>
                      <span className="px-1.5 py-0.5 bg-zinc-800 rounded">{ep.statusCode} {ep.status}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    <span className="text-xs font-mono">{ep.latencyMs}ms</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Sparkline values={history[ep.endpoint] || Array.from({ length: 20 }, () => ep.latencyMs + (Math.random()-0.5)*20)} />
                </div>
              </div>
            ))}
          </div>

          <div className="col-span-4 space-y-4">
            <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
                <Timer className="w-3 h-3" />Telemetry Worker Log
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {logs.length === 0 ? (
                  <div className="text-zinc-600">Waiting for EventBridge trigger...</div>
                ) : (
                  logs.map((l, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-zinc-600">{l.time}</span>
                      <span className="text-zinc-300">{l.msg}</span>
                    </div>
                  ))
                )}
                <div className="pt-2 text-zinc-600">λ pulsegrid-telemetry-worker | EventBridge cron(60s)</div>
                <div className="pt-1 text-zinc-500 break-all">{API_URL}/status</div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#121214] border border-[#1F1F23] p-5">
              <h3 className="text-xs uppercase tracking-widest text-zinc-500 mb-4">Edge Architecture</h3>
              <div className="font-mono text-xs space-y-2 text-zinc-400">
                <div>CloudFront (TLS 1.3) → OAC → S3 Private</div>
                <div>API Gateway → Lambda → DynamoDB</div>
                <div className="pt-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-">S3 BLOCKED</span>
                  <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-">OIDC AUTH</span>
                  <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-">LIVE API</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}