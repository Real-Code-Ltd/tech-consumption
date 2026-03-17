import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, BrainCircuit, Clock, Zap, Leaf } from "lucide-react";
import "./App.css";

interface AppUsage {
  app_executable: String,
  app_title: String,
  category: String,
  timestamp: String,
}

interface NetworkCall {
  domain: String,
  timestamp: String,
}

interface CategoryRule {
  description: string;
  gCO2_per_active_hour: number;
  wh_per_active_hour: number;
  keywords: string[];
}

interface EnvironmentalConfig {
  base_metrics: {
    network_api_calls: { gCO2_per_call: number, wh_per_call: number }
  };
  category_rules: Record<string, CategoryRule>;
}

const DEFAULT_IMPACT_CONFIG: EnvironmentalConfig = {
  base_metrics: { network_api_calls: { gCO2_per_call: 0, wh_per_call: 0 } },
  category_rules: {}
};

export default function App() {
  const [usageData, setUsageData] = useState<AppUsage[]>([]);
  const [networkData, setNetworkData] = useState<NetworkCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiImpact, setAiImpact] = useState<EnvironmentalConfig>(DEFAULT_IMPACT_CONFIG);

  useEffect(() => {
    async function fetchData() {
      try {
        const usageRaw: string = await invoke("get_usage_data");
        const netRaw: string = await invoke("get_network_data");
        const configRaw: string = await invoke("get_config");
        
        const usage = usageRaw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        const net = netRaw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));
        const config = JSON.parse(configRaw);
        
        setUsageData(usage);
        setNetworkData(net);
        setAiImpact(config);
      } catch (err) {
        console.error("Failed to fetch local data", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  // Calculate efficiency
  const totalCalls = networkData.length;
  // 1 usage record = 10s of activity (sampled every 10s)
  const totalActiveMinutes = (usageData.length * 10) / 60;
  
  // Intensity: AI calls per minute of activity
  const intensity = totalActiveMinutes > 0 ? (totalCalls / totalActiveMinutes) : 0;
  
  let statusColor = "bg-red-500/20";
  let textColor = "text-red-500";
  let statusText = "High Environmental Impact";
  let gradientBg = "from-red-950/40 to-black";

  if (intensity < 0.2) {
      statusColor = "bg-green-500/20";
      textColor = "text-green-500";
      statusText = "Low Environmental Impact";
      gradientBg = "from-green-950/40 to-black";
  } else if (intensity < 0.8) {
      statusColor = "bg-amber-500/20";
      textColor = "text-amber-500";
      statusText = "Moderate Env. Impact";
      gradientBg = "from-amber-950/40 to-black";
  }

  // Group chart data
  const slicedUsage = usageData.slice(-60);
  const chartData = slicedUsage.map((u, i, arr) => {
      const uTime = new Date(u.timestamp as string).getTime();
      const nextTime = i < arr.length - 1 ? new Date(arr[i+1].timestamp as string).getTime() : Date.now();
      
      const callsInTick = networkData.filter(n => {
          const nTime = new Date(n.timestamp as string).getTime();
          return nTime >= uTime && nTime < nextTime;
      }).length;

      return {
          time: new Date(u.timestamp as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ai_calls: callsInTick
      };
  });

  // Calculate environmental totals combining active app time and AI API calls
  let totalCarbon = totalCalls * aiImpact.base_metrics.network_api_calls.gCO2_per_call;
  let totalEnergy = totalCalls * aiImpact.base_metrics.network_api_calls.wh_per_call;

  usageData.forEach(u => {
      // 10s interval = 10 / 3600 hours
      const fractionHour = 10 / 3600;
      const metrics = aiImpact.category_rules[u.category as string] || aiImpact.category_rules["Other"];
      if (metrics) {
          totalCarbon += (metrics.gCO2_per_active_hour * fractionHour);
          totalEnergy += (metrics.wh_per_active_hour * fractionHour);
      }
  });

  const estCarbon = totalCarbon.toFixed(1);
  const estEnergy = totalEnergy.toFixed(1);

  if (loading) {
    return <div className="flex w-full h-screen items-center justify-center bg-gray-950 text-white"><div className="animate-pulse">Loading Tracker...</div></div>;
  }

  return (
    <main className={`min-h-screen w-full bg-linear-to-br ${gradientBg} text-gray-100 p-6 flex flex-col font-sans transition-all duration-1000 ease-in-out`}>
      {/* Header */}
      <header className="flex justify-between items-center mb-8 bg-black/30 p-4 rounded-2xl backdrop-blur-md border border-white/5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-full ${statusColor}`}>
            <BrainCircuit className={textColor} size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">AI Flow Tracker</h1>
            <p className="text-sm text-gray-400">by Real Code Ltd</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className={`text-lg font-bold flex items-center gap-2 ${textColor}`}>
            <Activity size={20} />
            {statusText}
          </div>
          <p className="text-xs text-gray-400 mt-1">Intensity: {intensity.toFixed(2)} calls/min</p>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
          <div className="bg-purple-500/20 p-3 rounded-xl"><Clock className="text-purple-400" size={24} /></div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Active Time Tracking</p>
            <h2 className="text-3xl font-bold">{Math.floor(totalActiveMinutes)}m</h2>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
          <div className="bg-emerald-500/20 p-3 rounded-xl"><Leaf className="text-emerald-400" size={24} /></div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Carbon Footprint</p>
            <h2 className="text-3xl font-bold">{estCarbon} <span className="text-lg font-normal text-gray-400">gCO₂</span></h2>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 backdrop-blur-sm flex items-center gap-4 hover:bg-white/10 transition-colors">
          <div className="bg-blue-500/20 p-3 rounded-xl"><Zap className="text-blue-400" size={24} /></div>
          <div>
            <p className="text-sm text-gray-400 mb-1">Est. Energy Usage</p>
            <h2 className="text-3xl font-bold">{estEnergy} <span className="text-lg font-normal text-gray-400">Wh</span></h2>
          </div>
        </div>
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col shadow-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-300">
            <Activity size={18} />
            Recent Usage Trend
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="time" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ai_calls" 
                  stroke="#3b82f6" 
                  strokeWidth={3} 
                  dot={false}
                  activeDot={{ r: 6, fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex flex-col shadow-2xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-300">
            <BrainCircuit size={18} />
            App Category Breakdown
          </h3>
          <div className="flex-1 w-full min-h-[300px]">
            {/* Simple simulated category split for UI presentation */}
            <div className="space-y-4">
              {Object.keys(aiImpact.category_rules).map(cat => {
                const count = usageData.filter(u => u.category === cat).length;
                const percentage = usageData.length > 0 ? (count / usageData.length) * 100 : 0;
                
                // Do not display empty categories!
                if (percentage === 0) return null;

                return (
                  <div key={cat} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">{cat}</span>
                      <span className="font-mono text-gray-400">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-8 text-center text-xs text-gray-600 font-medium">
        &copy; {new Date().getFullYear()} Real Code Ltd. All rights reserved. Strictly local tracking for absolute privacy.
      </footer>
    </main>
  );
}
