import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, Clock, Zap } from "lucide-react";

type CycleStatusData = {
  cycleRunning: boolean;
  completed: boolean;
  rewardsSent: boolean;
  timeLeftMs: number;
};

export function CycleStatus() {
  const [status, setStatus] = useState<CycleStatusData | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/cycle/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
          setTimeLeft(data.timeLeftMs || 0);
        }
      } catch (e) {
        console.error("Failed to fetch cycle status", e);
      }
    };
    
    fetchStatus();
    const int = setInterval(fetchStatus, 15000); // Check every 15s
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const int = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(int);
  }, [timeLeft]);

  if (!status) return null;

  return (
    <div className="w-full flex justify-center mt-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700/50 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 z-0"></div>
        {status.cycleRunning ? (
          <>
            <div className="flex items-center gap-3 relative z-10">
              <Zap className="w-6 h-6 text-yellow-400 animate-pulse" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: "ByteBounce, monospace", letterSpacing: "1px" }}>Current Cycle Active</span>
                <span className="text-yellow-400/80 text-sm">Open packs to join pull</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3 relative z-10">
             {status.rewardsSent && status.completed ? (
               <>
                 <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                 <div className="flex flex-col">
                   <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: "ByteBounce, monospace", letterSpacing: "1px" }}>Cycle Finished</span>
                   <span className="text-emerald-400 text-sm font-medium tracking-wide">Rewards Sent! 🚀</span>
                 </div>
               </>
             ) : status.completed ? (
               <>
                 <Clock className="w-6 h-6 text-blue-400" />
                 <div className="flex flex-col">
                   <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: "ByteBounce, monospace", letterSpacing: "1px" }}>Processing Rewards</span>
                   <span className="text-blue-400 text-sm font-medium tracking-wide">Awaiting Admin Confirmation...</span>
                 </div>
               </>
             ) : (
               <>
                 <Zap className="w-6 h-6 text-slate-400" />
                 <div className="flex flex-col">
                   <span className="text-white font-bold text-lg leading-none" style={{ fontFamily: "ByteBounce, monospace", letterSpacing: "1px" }}>Waiting for cycle</span>
                   <span className="text-slate-400 text-sm font-medium tracking-wide">No active cycle. Opening packs starts one!</span>
                 </div>
               </>
             )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
