import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Copy, RefreshCw, Search, Shield, ShieldCheck, CheckCircle2, XCircle, Ban, Hammer } from "lucide-react";
import { cn } from "../lib/utils";

type RewardHolder = {
  wallet_address: string;
  epic_count: number;
  legendary_count: number;
  reward_share_percent: number;
  current_cycle_eligible: boolean;
  next_cycle_eligible: boolean;
  times_eligible: number;
  is_blacklisted: boolean;
  last_checked_at: string | null;
};

export function AdminRewards() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [holders, setHolders] = useState<RewardHolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCurrentEligible, setFilterCurrentEligible] = useState(false);
  const [filterNextEligible, setFilterNextEligible] = useState(false);
  const [filterEpicOnly, setFilterEpicOnly] = useState(false);
  const [filterLegendaryOnly, setFilterLegendaryOnly] = useState(false);

  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid password");
        }
        throw new Error("Failed to fetch data");
      }

      const data = await res.json();
      setHolders(data.holders || []);
      setAuthenticated(true);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedWallet(text);
    setTimeout(() => setCopiedWallet(null), 2000);
  };

  const toggleBlacklist = async (wallet: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/admin/rewards/blacklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, wallet, blacklist: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to update blacklist");
      
      // Update local state to reflect change
      setHolders(prev => prev.map(h => 
        h.wallet_address === wallet 
          ? { 
              ...h, 
              is_blacklisted: !currentStatus, 
              current_cycle_eligible: !currentStatus ? false : h.current_cycle_eligible,
              next_cycle_eligible: !currentStatus ? false : h.next_cycle_eligible
            } 
          : h
      ));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredHolders = holders.filter(h => {
    if (filterCurrentEligible && !h.current_cycle_eligible) return false;
    if (filterNextEligible && !h.next_cycle_eligible) return false;
    if (filterEpicOnly && h.epic_count <= 0) return false;
    if (filterLegendaryOnly && h.legendary_count <= 0) return false;
    if (searchQuery && !h.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleMarkSent = async () => {
    if (!confirm("Are you sure you want to mark all rewards for the completed cycle as sent?")) return;
    try {
      const res = await fetch("/api/admin/rewards/mark-sent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      if (!res.ok) throw new Error("Failed to mark sent");
      alert("Rewards marked as sent!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100"
        >
          <div className="flex flex-col items-center justify-center mb-8">
            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">Admin Access</h1>
            <p className="text-slate-500 text-base mt-2">Please authenticate to view rewards data</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin Password"
                className="w-full px-5 py-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-lg"
              />
            </div>
            {error && (
              <p className="text-red-500 text-base font-medium text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl disabled:opacity-50 transition-colors"
            >
              {loading ? "Authenticating..." : "Unlock Dashboard"}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Reward Holders</h1>
              <p className="text-sm text-slate-500 font-medium">Administration Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleMarkSent}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-base font-bold transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              Mark Rewards Sent
            </button>
            <button 
              onClick={() => handleLogin()}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-base font-bold transition-colors disabled:opacity-50"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-500 text-base font-bold uppercase tracking-wider">Total Holders</span>
            <span className="text-5xl font-black text-slate-900 mt-3">{holders.length}</span>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-500 text-base font-bold uppercase tracking-wider">Eligible Now</span>
            <span className="text-5xl font-black text-emerald-600 mt-3">
              {holders.filter(h => h.current_cycle_eligible).length}
            </span>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-500 text-base font-bold uppercase tracking-wider">Epic Minted</span>
            <span className="text-5xl font-black text-purple-600 mt-3">
              {holders.reduce((acc, h) => acc + Number(h.epic_count), 0)}
            </span>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <span className="text-slate-500 text-base font-bold uppercase tracking-wider">Legendary Minted</span>
            <span className="text-5xl font-black text-amber-500 mt-3">
              {holders.reduce((acc, h) => acc + Number(h.legendary_count), 0)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 relative">
              <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search wallet address..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-base"
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setFilterCurrentEligible(!filterCurrentEligible)}
                className={cn(
                  "px-5 py-3 rounded-xl text-base font-bold transition-colors border",
                  filterCurrentEligible ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Current Eligible
              </button>
              <button 
                onClick={() => setFilterNextEligible(!filterNextEligible)}
                className={cn(
                  "px-5 py-3 rounded-xl text-base font-bold transition-colors border",
                  filterNextEligible ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Next Eligible
              </button>
              <button 
                onClick={() => setFilterEpicOnly(!filterEpicOnly)}
                className={cn(
                  "px-5 py-3 rounded-xl text-base font-bold transition-colors border",
                  filterEpicOnly ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Has Epic
              </button>
              <button 
                onClick={() => setFilterLegendaryOnly(!filterLegendaryOnly)}
                className={cn(
                  "px-5 py-3 rounded-xl text-base font-bold transition-colors border",
                  filterLegendaryOnly ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Has Legendary
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider">Wallet</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Epic</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Legendary</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Share</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Current</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Next</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Times</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-5 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHolders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-medium">
                      No holders match your filters.
                    </td>
                  </tr>
                ) : (
                  filteredHolders.map((h, i) => (
                    <tr key={h.wallet_address || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-bold text-slate-700">
                            {h.wallet_address.slice(0, 4)}...{h.wallet_address.slice(-4)}
                          </span>
                          <button 
                            onClick={() => copyToClipboard(h.wallet_address)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                            title="Copy wallet address"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                          {copiedWallet === h.wallet_address && (
                            <span className="text-xs uppercase font-bold text-emerald-600 ml-1 bg-emerald-50 px-2 py-1 rounded">Copied</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-bold text-slate-700">
                        {h.epic_count > 0 ? (
                           <span className="text-purple-600 bg-purple-50 px-3 py-1.5 rounded-lg text-lg">{h.epic_count}</span>
                        ) : (
                           <span className="text-slate-300 text-lg">0</span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-bold text-slate-700">
                        {h.legendary_count > 0 ? (
                           <span className="text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg text-lg">{h.legendary_count}</span>
                        ) : (
                           <span className="text-slate-300 text-lg">0</span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        <span className="font-black text-slate-900 text-lg">{Number(h.reward_share_percent).toFixed(1)}%</span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        {h.current_cycle_eligible ? (
                          <span className="inline-flex items-center justify-center text-emerald-600 bg-emerald-50 w-8 h-8 rounded-full">
                            <CheckCircle2 className="w-5 h-5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center text-slate-300 w-8 h-8 rounded-full">
                            <XCircle className="w-5 h-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        {h.next_cycle_eligible ? (
                          <span className="inline-flex items-center justify-center text-blue-600 bg-blue-50 w-8 h-8 rounded-full">
                            <CheckCircle2 className="w-5 h-5" />
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center text-slate-300 w-8 h-8 rounded-full">
                            <XCircle className="w-5 h-5" />
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center font-black text-slate-800 text-lg">
                        {h.times_eligible || 0}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-center">
                        {h.is_blacklisted ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wider">
                            <Ban className="w-3.5 h-3.5" /> Blacklisted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <button
                          onClick={() => toggleBlacklist(h.wallet_address, h.is_blacklisted)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5",
                            h.is_blacklisted 
                               ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
                               : "bg-red-50 text-red-600 hover:bg-red-100"
                          )}
                        >
                          <Hammer className="w-4 h-4" />
                          {h.is_blacklisted ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
