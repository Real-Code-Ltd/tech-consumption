import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, BrainCircuit, Clock, Zap, Leaf, Minus, X, Settings, Pin, Power, Globe, Plus, Trash2, ChevronDown, ChevronUp, Save, CheckCircle } from "lucide-react";
import "./App.css";

// ── Carbon intensity by region (gCO2/kWh from electricity maps) ──────────────
const REGION_INTENSITY: Record<string, { label: string; gCO2_per_kwh: number }> = {
  global:  { label: "Global average",        gCO2_per_kwh: 475 },
  us:      { label: "United States",          gCO2_per_kwh: 386 },
  uk:      { label: "United Kingdom",         gCO2_per_kwh: 233 },
  eu:      { label: "EU average",             gCO2_per_kwh: 276 },
  fr:      { label: "France",                 gCO2_per_kwh: 85  },
  de:      { label: "Germany",                gCO2_per_kwh: 350 },
  au:      { label: "Australia",              gCO2_per_kwh: 490 },
  ca:      { label: "Canada",                 gCO2_per_kwh: 130 },
  in:      { label: "India",                  gCO2_per_kwh: 708 },
  cn:      { label: "China",                  gCO2_per_kwh: 555 },
  no:      { label: "Norway",                 gCO2_per_kwh: 28  },
  se:      { label: "Sweden",                 gCO2_per_kwh: 45  },
};
const GLOBAL_INTENSITY = 475; // baseline used in default config

interface AppUsage {
  app_executable: string;
  app_title: string;
  category: string;
  timestamp: string;
}

interface NetworkCall {
  domain: string;
  timestamp: string;
}

interface CategoryRule {
  description: string;
  gCO2_per_active_hour: number;
  wh_per_active_hour: number;
  keywords: string[];
}

interface EnvironmentalConfig {
  base_metrics: {
    network_api_calls: { gCO2_per_call: number; wh_per_call: number };
  };
  category_rules: Record<string, CategoryRule>;
}

const DEFAULT_IMPACT_CONFIG: EnvironmentalConfig = {
  base_metrics: { network_api_calls: { gCO2_per_call: 0, wh_per_call: 0 } },
  category_rules: {},
};

// ── Toggle component ──────────────────────────────────────────────────────────
function Toggle({ enabled, onToggle, label }: { enabled: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? "bg-blue-500" : "bg-white/10"}`}
      title={label}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-4" : "translate-x-1"}`}
      />
    </button>
  );
}

// ── Main app ──────────────────────────────────────────────────────────────────
export default function App() {
  const appWindow = getCurrentWindow();

  const [usageData, setUsageData] = useState<AppUsage[]>([]);
  const [networkData, setNetworkData] = useState<NetworkCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiImpact, setAiImpact] = useState<EnvironmentalConfig>(DEFAULT_IMPACT_CONFIG);

  // Settings panel state
  const [showSettings, setShowSettings] = useState(false);
  const [alwaysOnTop, setAlwaysOnTop] = useState(false);
  const [autostart, setAutostart] = useState(false);
  const [regionKey, setRegionKey] = useState("global");
  const [editConfig, setEditConfig] = useState<EnvironmentalConfig>(DEFAULT_IMPACT_CONFIG);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    async function fetchData() {
      try {
        const usageRaw: string = await invoke("get_usage_data");
        const netRaw: string = await invoke("get_network_data");
        const configRaw: string = await invoke("get_config");
        const usage = usageRaw.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
        const net = netRaw.split("\n").filter((l) => l.trim()).map((l) => JSON.parse(l));
        const config: EnvironmentalConfig = JSON.parse(configRaw);
        setUsageData(usage);
        setNetworkData(net);
        setAiImpact(config);
        setEditConfig(JSON.parse(JSON.stringify(config)));
      } catch (err) {
        console.error("Failed to fetch local data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Load autostart status once
  useEffect(() => {
    invoke<boolean>("get_autostart_status").then(setAutostart).catch(() => {});
  }, []);

  const handleAlwaysOnTop = useCallback(async (val: boolean) => {
    setAlwaysOnTop(val);
    await invoke("set_always_on_top", { onTop: val });
  }, []);

  const handleAutostart = useCallback(async (val: boolean) => {
    setAutostart(val);
    await invoke("set_autostart", { enabled: val });
  }, []);

  // Apply region multiplier to a config copy for display
  const regionMultiplier = REGION_INTENSITY[regionKey].gCO2_per_kwh / GLOBAL_INTENSITY;

  const scaledConfig: EnvironmentalConfig = {
    ...aiImpact,
    base_metrics: {
      network_api_calls: {
        gCO2_per_call: aiImpact.base_metrics.network_api_calls.gCO2_per_call * regionMultiplier,
        wh_per_call: aiImpact.base_metrics.network_api_calls.wh_per_call,
      },
    },
    category_rules: Object.fromEntries(
      Object.entries(aiImpact.category_rules).map(([k, v]) => [
        k,
        { ...v, gCO2_per_active_hour: v.gCO2_per_active_hour * regionMultiplier },
      ])
    ),
  };

  // Metrics calculations
  const totalCalls = networkData.length;
  const totalActiveMinutes = (usageData.length * 10) / 60;
  const intensity = totalActiveMinutes > 0 ? totalCalls / totalActiveMinutes : 0;

  let statusColor = "bg-red-500/20";
  let textColor = "text-red-500";
  let statusText = "High Environmental Impact";
  let gradientBg = "from-red-950/40 to-black";
  if (intensity < 0.2) {
    statusColor = "bg-green-500/20"; textColor = "text-green-500";
    statusText = "Low Environmental Impact"; gradientBg = "from-green-950/40 to-black";
  } else if (intensity < 0.8) {
    statusColor = "bg-amber-500/20"; textColor = "text-amber-500";
    statusText = "Moderate Env. Impact"; gradientBg = "from-amber-950/40 to-black";
  }

  // Build 5-minute bucket chart: count usage records per category per bucket
  const BUCKET_MS = 5 * 60 * 1000;
  const categoryColors: Record<string, string> = {
    "Development Environment": "#6366f1",
    "Web Browser":             "#3b82f6",
    "Communication":           "#10b981",
    "Design Tools":            "#f59e0b",
    "Office Software":         "#8b5cf6",
    "Media Player":            "#ec4899",
    "Game Client":             "#14b8a6",
    "System Utilities":        "#64748b",
    "Security":                "#ef4444",
    "Other":                   "#475569",
  };
  const activeCategories = Array.from(new Set(usageData.map((u) => u.category))).filter(Boolean);
  const chartData = (() => {
    if (usageData.length === 0) return [];
    const first = new Date(usageData[0].timestamp).getTime();
    const last  = new Date(usageData[usageData.length - 1].timestamp).getTime();
    const buckets: Record<string, Record<string, number>> = {};
    for (let t = first; t <= last + BUCKET_MS; t += BUCKET_MS) {
      const label = new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      buckets[label] = {};
      activeCategories.forEach((c) => { buckets[label][c] = 0; });
    }
    usageData.forEach((u) => {
      const t = new Date(u.timestamp).getTime();
      const bucketTime = Math.floor((t - first) / BUCKET_MS) * BUCKET_MS + first;
      const label = new Date(bucketTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (buckets[label]) buckets[label][u.category] = (buckets[label][u.category] || 0) + 1;
    });
    return Object.entries(buckets).map(([time, cats]) => ({ time, ...cats }));
  })();
  // AI call overlay: bucket network calls into same 5-min windows
  const aiCallData = (() => {
    if (networkData.length === 0 || usageData.length === 0) return [] as {time:string; ai_calls:number}[];
    const first = new Date(usageData[0].timestamp).getTime();
    const buckets: Record<string, number> = {};
    networkData.forEach((n) => {
      const t = new Date(n.timestamp).getTime();
      const bucketTime = Math.floor((t - first) / BUCKET_MS) * BUCKET_MS + first;
      const label = new Date(bucketTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      buckets[label] = (buckets[label] || 0) + 1;
    });
    return Object.entries(buckets).map(([time, ai_calls]) => ({ time, ai_calls }));
  })();

  let totalCarbon = totalCalls * scaledConfig.base_metrics.network_api_calls.gCO2_per_call;
  let totalEnergy = totalCalls * scaledConfig.base_metrics.network_api_calls.wh_per_call;
  usageData.forEach((u) => {
    const frac = 10 / 3600;
    const m = scaledConfig.category_rules[u.category] || scaledConfig.category_rules["Other"];
    if (m) { totalCarbon += m.gCO2_per_active_hour * frac; totalEnergy += m.wh_per_active_hour * frac; }
  });

  // Settings helpers
  const addKeyword = (cat: string) => {
    const kw = (newKeyword[cat] || "").trim().toLowerCase();
    if (!kw) return;
    setEditConfig((prev) => ({
      ...prev,
      category_rules: {
        ...prev.category_rules,
        [cat]: { ...prev.category_rules[cat], keywords: [...prev.category_rules[cat].keywords, kw] },
      },
    }));
    setNewKeyword((prev) => ({ ...prev, [cat]: "" }));
  };

  const removeKeyword = (cat: string, kw: string) => {
    setEditConfig((prev) => ({
      ...prev,
      category_rules: {
        ...prev.category_rules,
        [cat]: { ...prev.category_rules[cat], keywords: prev.category_rules[cat].keywords.filter((k) => k !== kw) },
      },
    }));
  };

  const saveSettings = async () => {
    setSaveStatus("saving");
    try {
      await invoke("save_config", { configJson: JSON.stringify(editConfig) });
      setAiImpact(JSON.parse(JSON.stringify(editConfig)));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (e) {
      console.error(e);
      setSaveStatus("idle");
    }
  };

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center bg-gray-950 text-white rounded-2xl">
        <div className="animate-pulse">Loading tracking data...</div>
      </div>
    );
  }

  return (
    <main className={`min-h-screen w-full bg-linear-to-br ${gradientBg} text-gray-100 flex flex-col font-sans transition-all duration-1000 ease-in-out rounded-2xl overflow-hidden border border-white/10 shadow-2xl`}>

      {/* ── Custom Title Bar ─────────────────────────────────────────────────── */}
      <div data-tauri-drag-region className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-md border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <BrainCircuit size={14} className="text-gray-400" />
          <span className="text-xs text-gray-400 font-medium tracking-wide">Tech energy usage</span>
        </div>
        <div className="flex items-center gap-1">
          {alwaysOnTop && <Pin size={11} className="text-blue-400 mr-1" />}
          <button onClick={() => setShowSettings((s) => !s)} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${showSettings ? "text-blue-400 bg-blue-500/10" : "text-gray-500 hover:text-gray-200 hover:bg-white/10"}`} title="Settings"><Settings size={12} /></button>
          <button onClick={() => appWindow.minimize()} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-200 hover:bg-white/10 transition-colors" title="Minimise"><Minus size={12} /></button>
          <button onClick={() => appWindow.hide()} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Hide to tray"><X size={12} /></button>
        </div>
      </div>

      {/* ── Settings Panel (slide-in) ────────────────────────────────────────── */}
      {showSettings && (
        <div className="bg-black/60 backdrop-blur-xl border-b border-white/5 overflow-y-auto max-h-[70vh]">
          <div className="p-5 space-y-6">
            <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Settings</h2>

            {/* Window behaviour */}
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Window</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-300"><Pin size={14} className="text-blue-400" /> Always on top</div>
                <Toggle enabled={alwaysOnTop} onToggle={() => handleAlwaysOnTop(!alwaysOnTop)} label="Always on top" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-300"><Power size={14} className="text-green-400" /> Launch on startup</div>
                <Toggle enabled={autostart} onToggle={() => handleAutostart(!autostart)} label="Launch on startup" />
              </div>
            </div>

            {/* Region / carbon grid intensity */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1"><Globe size={11} /> Carbon Region</p>
              <select
                value={regionKey}
                onChange={(e) => setRegionKey(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500"
              >
                {Object.entries(REGION_INTENSITY).map(([k, v]) => (
                  <option key={k} value={k} className="bg-gray-900">{v.label} — {v.gCO2_per_kwh} gCO₂/kWh</option>
                ))}
              </select>
              <p className="text-xs text-gray-500">Multiplier: ×{regionMultiplier.toFixed(2)} vs global baseline. Carbon figures update live.</p>
            </div>

            {/* Category keyword editor */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider">App Category Keywords</p>
              <div className="space-y-1">
                {Object.entries(editConfig.category_rules).map(([cat, rule]) => (
                  <div key={cat} className="rounded-xl border border-white/5 overflow-hidden">
                    <button
                      onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      <span>{cat}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{rule.keywords.length} keywords</span>
                        {expandedCat === cat ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </button>
                    {expandedCat === cat && (
                      <div className="px-4 pb-3 bg-black/20 space-y-2">
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {rule.keywords.map((kw) => (
                            <span key={kw} className="flex items-center gap-1 text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded-full">
                              {kw}
                              <button onClick={() => removeKeyword(cat, kw)} className="text-gray-500 hover:text-red-400"><Trash2 size={10} /></button>
                            </span>
                          ))}
                          {rule.keywords.length === 0 && <span className="text-xs text-gray-600 italic">No keywords</span>}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <input
                            value={newKeyword[cat] || ""}
                            onChange={(e) => setNewKeyword((prev) => ({ ...prev, [cat]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && addKeyword(cat)}
                            placeholder="Add keyword…"
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500"
                          />
                          <button onClick={() => addKeyword(cat)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors"><Plus size={12} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={saveSettings}
              disabled={saveStatus === "saving"}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${saveStatus === "saved" ? "bg-green-600/40 text-green-300" : "bg-blue-600 hover:bg-blue-500 text-white"}`}
            >
              {saveStatus === "saved" ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save category config</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Dashboard ────────────────────────────────────────────────────────── */}
      <div className="p-6 flex flex-col flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center mb-6 bg-black/30 p-4 rounded-2xl backdrop-blur-md border border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-full ${statusColor}`}>
              <BrainCircuit className={textColor} size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Tech energy usage</h1>
              <p className="text-sm text-gray-400">by Real Code Ltd · <span className="text-blue-400">{REGION_INTENSITY[regionKey].label}</span></p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
              <Activity size={20} />{statusText}
            </div>
            <p className="text-xs text-gray-400 mt-1">Intensity: {intensity.toFixed(2)} calls/min</p>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="bg-purple-500/20 p-3 rounded-xl"><Clock className="text-purple-400" size={24} /></div>
            <div><p className="text-sm text-gray-400 mb-1">Active Time</p><h2 className="text-3xl font-bold">{Math.floor(totalActiveMinutes)}m</h2></div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="bg-emerald-500/20 p-3 rounded-xl"><Leaf className="text-emerald-400" size={24} /></div>
            <div><p className="text-sm text-gray-400 mb-1">Carbon Footprint</p><h2 className="text-3xl font-bold">{totalCarbon.toFixed(1)} <span className="text-lg font-normal text-gray-400">gCO₂</span></h2></div>
          </div>
          <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
            <div className="bg-blue-500/20 p-3 rounded-xl"><Zap className="text-blue-400" size={24} /></div>
            <div><p className="text-sm text-gray-400 mb-1">Est. Energy</p><h2 className="text-3xl font-bold">{totalEnergy.toFixed(1)} <span className="text-lg font-normal text-gray-400">Wh</span></h2></div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300"><Activity size={18} />Active Time by Category</h3>
            <div className="flex-1 w-full min-h-[240px]">
              {chartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-gray-600 text-sm">Collecting data… check back in a minute.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="time" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round((v * 10) / 60)}m`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#111", borderColor: "#333", borderRadius: "12px" }}
                      itemStyle={{ color: "#ccc" }}
                      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                      // @ts-expect-error recharts ValueType/NameType can be undefined at runtime
                      formatter={(value: number, name: string) => [`${Math.round((value * 10) / 60)}m`, name]}
                    />
                    <Legend wrapperStyle={{ fontSize: "11px", color: "#888" }} />
                    {activeCategories.map((cat) => (
                      <Bar key={cat} dataKey={cat} stackId="a" fill={categoryColors[cat] ?? "#64748b"} radius={[0, 0, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            {aiCallData.length > 0 && (
              <div className="mt-4">
                <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><BrainCircuit size={11} /> AI API calls detected</p>
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={aiCallData}>
                    <XAxis dataKey="time" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ backgroundColor: "#111", borderColor: "#333", borderRadius: "8px" }} itemStyle={{ color: "#fff" }} />
                    <Line type="monotone" dataKey="ai_calls" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col shadow-2xl">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-300"><BrainCircuit size={18} />App Category Breakdown</h3>
            <div className="flex-1 w-full min-h-[240px] overflow-y-auto space-y-3">
              {(() => {
                const maxCount = Math.max(1, ...Object.keys(aiImpact.category_rules).map((cat) => usageData.filter((u) => u.category === cat).length));
                return Object.keys(aiImpact.category_rules).map((cat) => {
                  const count = usageData.filter((u) => u.category === cat).length;
                  if (count === 0) return null;
                  const totalSecs = count * 10;
                  const h = Math.floor(totalSecs / 3600);
                  const m = Math.floor((totalSecs % 3600) / 60);
                  const timeLabel = h > 0 ? `${h}h ${m}m` : `${m}m`;
                  const barPct = (count / maxCount) * 100;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-sm"><span className="text-gray-300">{cat}</span><span className="font-mono text-gray-400">{timeLabel}</span></div>
                      <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${barPct}%` }} />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-gray-600 font-medium">
          &copy; {new Date().getFullYear()} Real Code Ltd. All rights reserved. Strictly local tracking for absolute privacy.
        </footer>
      </div>
    </main>
  );
}
