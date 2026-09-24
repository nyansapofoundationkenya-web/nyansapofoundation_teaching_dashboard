"use client";

const mockKpis = [
  { label: "MAU / DAU Ratio", value: "42.8%", delta: "+2.4%", up: true },
  { label: "Retention Rate", value: "88.2%", delta: "+1.1%", up: true },
  { label: "Avg. Session Depth", value: "14.5", delta: "-0.5", up: false },
];

const mockCohorts = [
  { week: "Sep 04 - Sep 10", size: 1402, values: [98, 82, 76, 65, 61, 54, 48, 39] },
  { week: "Sep 11 - Sep 17", size: 1215, values: [95, 79, 68, 62, 55, 41, 32, null] },
  { week: "Sep 18 - Sep 24", size: 1680, values: [99, 84, 72, 61, 50, 35, null, null] },
];

const mockTopOrgs = [
  { name: "Global Networks Inc.", type: "Enterprise", users: 2401, score: "9.8/10", pct: 85 },
  { name: "Starlight University", type: "Education", users: 1850, score: "8.4/10", pct: 62 },
  { name: "HealthLink Systems", type: "Healthcare", users: 1120, score: "7.2/10", pct: 45 },
];

function heatColor(v) {
  if (v == null) return null;
  if (v >= 90) return "bg-primary-3 text-primary-1";
  if (v >= 75) return "bg-primary-2 text-primary-1";
  if (v >= 55) return "bg-background-lighter text-foreground";
  return "bg-background text-gray-300 border border-gray-600";
}

export default function PlatformStats() {
  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">Showing mock data — connect to real analytics when ready.</p>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockKpis.map((k) => (
          <div key={k.label} className="bg-background-light border border-gray-600 rounded-xl p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">{k.label}</p>
            <div className="flex items-end gap-2">
              <h2 className="text-3xl font-bold text-foreground leading-none">{k.value}</h2>
              <span className={`text-xs font-bold mb-0.5 ${k.up ? "text-primary-2" : "text-red-400"}`}>{k.delta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Growth chart + engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-background-light border border-gray-600 rounded-xl p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-foreground">User Growth Trend</h3>
            <div className="flex gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-2 inline-block" /> Signups</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary-3 inline-block" /> Projections</span>
            </div>
          </div>
          <svg viewBox="0 0 800 220" className="w-full h-48">
            <defs>
              <linearGradient id="growthGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#5aa2ce" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#5aa2ce" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0,170 Q100,150 200,120 T400,80 T600,45 T800,15 L800,220 L0,220 Z" fill="url(#growthGradient)" />
            <path d="M0,170 Q100,150 200,120 T400,80 T600,45 T800,15" fill="none" stroke="#5aa2ce" strokeWidth="3" />
            {[[200, 120], [400, 80], [600, 45]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="4" fill="#f7cc1c" />
            ))}
          </svg>
          <div className="flex justify-between text-[10px] text-gray-500 mt-2">
            <span>Oct 01</span><span>Oct 10</span><span>Oct 20</span><span>Oct 30</span>
          </div>
        </div>

        <div className="bg-background-light border border-gray-600 rounded-xl p-5 flex flex-col">
          <h3 className="font-bold text-foreground mb-6">User Engagement</h3>
          <div className="flex-grow flex items-center justify-center">
            <div className="relative w-32 h-32 rounded-full border-[10px] border-background-lighter flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-[10px] border-primary-3" style={{ clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 100%, 0 100%, 0 50%)", transform: "rotate(45deg)" }} />
              <div className="absolute inset-0 rounded-full border-[10px] border-primary-2" style={{ clipPath: "polygon(50% 50%, 50% 0, 100% 0, 100% 50%)", transform: "rotate(-45deg)" }} />
              <div className="text-center">
                <span className="block font-bold text-foreground">1,248</span>
                <span className="text-[10px] text-gray-400">Active</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5 mt-4 text-xs">
            <span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-primary-2" /> Assessments (65%)</span>
            <span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-primary-3" /> Onboarding (25%)</span>
            <span className="flex items-center gap-2 text-gray-300"><span className="w-2 h-2 rounded-full bg-background-lighter" /> Settings (10%)</span>
          </div>
        </div>
      </div>

      {/* Retention heatmap */}
      <div className="bg-background-light border border-gray-600 rounded-xl p-5 overflow-x-auto">
        <h3 className="font-bold text-foreground mb-1">Retention Cohort Analysis</h3>
        <p className="text-xs text-gray-400 mb-4">Weekly retention by signup week</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-600">
              <th className="py-2 pr-3">Cohort</th>
              <th className="py-2 px-2">Size</th>
              {Array.from({ length: 8 }, (_, i) => <th key={i} className="py-2 px-2 text-center">W{i + 1}</th>)}
            </tr>
          </thead>
          <tbody>
            {mockCohorts.map((c) => (
              <tr key={c.week} className="border-b border-gray-600/40">
                <td className="py-2 pr-3 font-medium text-foreground whitespace-nowrap">{c.week}</td>
                <td className="py-2 px-2 text-gray-300">{c.size.toLocaleString()}</td>
                {c.values.map((v, i) => (
                  <td key={i} className="py-2 px-2 text-center">
                    {v == null ? <span className="text-gray-600">–</span> : (
                      <div className={`rounded px-1 py-1 text-xs font-bold ${heatColor(v)}`}>{v}%</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Top organizations */}
      <div className="bg-background-light border border-gray-600 rounded-xl p-5">
        <h3 className="font-bold text-foreground mb-4">Top Active Organizations</h3>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[10px] text-gray-400 uppercase border-b border-gray-600">
              <th className="py-2">Organization</th><th className="py-2">Type</th><th className="py-2">Active Users</th><th className="py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {mockTopOrgs.map((o) => (
              <tr key={o.name} className="border-b border-gray-600/40">
                <td className="py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-background-lighter flex items-center justify-center font-bold text-primary-2 text-xs">
                    {o.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                  </div>
                  <span className="font-medium text-foreground">{o.name}</span>
                </td>
                <td className="py-3 text-gray-300">{o.type}</td>
                <td className="py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-14 h-1.5 bg-background-lighter rounded-full overflow-hidden">
                      <span className="block h-full bg-primary-2" style={{ width: `${o.pct}%` }} />
                    </span>
                    <span className="text-gray-300">{o.users.toLocaleString()}</span>
                  </div>
                </td>
                <td className="py-3 font-bold text-primary-2">{o.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}