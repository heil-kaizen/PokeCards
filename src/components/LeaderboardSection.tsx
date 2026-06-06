import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Trophy, Medal, User, Percent } from "lucide-react";

type LeaderboardEntry = {
  wallet_address: string;
  reward_share_percent: string;
};

export function LeaderboardSection() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        if (res.ok) {
          const json = await res.json();
          setData(json.leaderboard || []);
        }
      } catch (err) {
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const formatWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
  };

  return (
    <div className="w-full flex justify-center py-12">
      <div className="w-full max-w-4xl relative px-4 sm:px-6">
        <div className="text-center mb-12">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4 drop-shadow-[4px_4px_0_rgba(0,0,0,0.2)]" />
          <h2 
            className="text-4xl md:text-5xl lg:text-6xl tracking-widest text-[#f74170] leading-[1.1]" 
            style={{ 
              fontFamily: "ByteBounce, monospace", 
              textShadow: "3px 3px 0px rgba(0,0,0,0.15), 2px 2px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" 
            }}
          >
            TOP COLLECTORS
          </h2>
          <p 
            className="text-xl md:text-2xl text-white max-w-2xl mx-auto tracking-wide mt-4" 
            style={{ 
              fontFamily: "ByteBounce, monospace", 
              textShadow: "2px 2px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" 
            }}
          >
            Leaderboard rankings based on reward share percentage for the current cycle.
          </p>
        </div>

        <div className="bg-[#f0f0f0] p-4 relative border-8 border-[#2d2d2d]" style={{ boxShadow: "12px 12px 0px rgba(0,0,0,0.3)" }}>
          <div className="overflow-x-auto bg-white border-4 border-[#8e8a8d]">
            <div className="max-h-[500px] overflow-y-auto no-scrollbar scroll-smooth">
              <table className="w-full text-left border-collapse" style={{ fontFamily: "ByteBounce, monospace" }}>
                <thead className="sticky top-0 bg-[#c4c4c4] z-10 shadow-[0_4px_0_0_#8e8a8d]">
                  <tr>
                    <th className="p-3 text-[#2d2d2d] font-bold w-20 text-center text-lg md:text-xl tracking-widest uppercase">Rank</th>
                    <th className="p-3 text-[#2d2d2d] font-bold text-lg md:text-xl tracking-widest uppercase">Wallet</th>
                    <th className="p-3 text-[#2d2d2d] font-bold text-right text-lg md:text-xl tracking-widest uppercase">Share %</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500 text-xl tracking-wider">
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          Loading Data...
                        </motion.div>
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500 text-xl tracking-wider">
                        No data available for this cycle.
                      </td>
                    </tr>
                  ) : (
                    data.map((entry, index) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        key={entry.wallet_address} 
                        className="border-b-4 border-[#e0e0e0] hover:bg-[#ffeaf0] transition-colors"
                      >
                        <td className="p-3 text-center">
                          {index === 0 ? <Medal className="w-5 h-5 md:w-6 md:h-6 text-yellow-400 mx-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]" /> :
                           index === 1 ? <Medal className="w-5 h-5 md:w-6 md:h-6 text-slate-400 mx-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]" /> :
                           index === 2 ? <Medal className="w-5 h-5 md:w-6 md:h-6 text-amber-600 mx-auto drop-shadow-[2px_2px_0_rgba(0,0,0,0.2)]" /> :
                           <span className="text-[#8e8a8d] font-bold text-lg md:text-xl tracking-widest">#{index + 1}</span>}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 rounded-none bg-[#f0f0f0] border-2 border-[#2d2d2d] flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 md:w-4 md:h-4 text-[#2d2d2d]" />
                            </div>
                            <span className="font-bold text-[#2d2d2d] text-lg md:text-xl tracking-widest">
                              {formatWallet(entry.wallet_address)}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1 font-bold text-lg md:text-xl tracking-widest">
                            <span className="text-[#f74170] drop-shadow-[1px_1px_0_#2d2d2d]">
                              {parseFloat(entry.reward_share_percent).toFixed(2)}
                            </span>
                            <Percent className="w-3 h-3 md:w-4 md:h-4 text-[#f74170]" />
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
