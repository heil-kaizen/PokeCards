import { useState, useEffect, useRef, SyntheticEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store/useStore";
import { createPortal } from "react-dom";
import { Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PackOpening() {
  const wallet = useStore(s => s.wallet);
  const isEligible = useStore(s => s.isEligible);
  const fetchVault = useStore(s => s.fetchVault);
  const [cooldown, setCooldown] = useState(0);
  const [canOpen, setCanOpen] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [pulledCards, setPulledCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkStatus = async () => {
    if (!wallet) return;
    try {
      const res = await fetch("/api/pack/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet })
      });
      const data = await res.json();
      setCooldown(data.timeRemaining);
      setCanOpen(data.canOpen);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkStatus();
    const int = setInterval(checkStatus, 5000);
    return () => clearInterval(int);
  }, [wallet]);

  const handleOpen = async () => {
    if (!canOpen || !wallet) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pack/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet })
      });
      const data = await res.json();
      if (data.cards) {
        setPulledCards(data.cards);
        setIsVideoPlaying(true);
        fetchVault();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const secs = s % 60;
    return `${m.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div 
        initial={{ y: 0 }}
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="relative w-60 cursor-pointer group drop-shadow-2xl hover:scale-105 transition-transform"
        style={{ willChange: "transform" }}
        onClick={handleOpen}
      >
        <div className="absolute inset-0 bg-emerald-400 rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-300" style={{ willChange: "opacity" }} />
        <img 
          src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokePack%208-bit.webp" 
          alt="Premium Pack"
          className="w-full h-auto relative z-10 drop-shadow-2xl"
        />
      </motion.div>

      <div className="mt-8">
        {!wallet || !isEligible ? (
          <button 
            disabled
            className="flex items-center gap-2 group relative px-8 py-4 bg-slate-100 rounded-full font-black text-lg text-slate-400 tracking-wider cursor-not-allowed shadow-inner"
          >
            <Lock className="w-5 h-5" />
            NOT ELIGIBLE
          </button>
        ) : !canOpen ? (
          <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-white flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
             <span className="font-bold text-slate-700 font-mono text-lg">{formatTime(cooldown)}</span>
             <span className="text-sm text-slate-400 font-medium tracking-wide placeholder-slate-400">COOLDOWN</span>
          </div>
        ) : (
          <button 
            disabled={loading}
            onClick={handleOpen}
            className="relative px-8 py-3 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-[2px] transition-transform flex items-center justify-center group mx-auto"
            style={{
              backgroundColor: "#f74170",
              boxShadow: `
                inset 0 -4px 0 0 #b32a4e,
                inset 0 3px 0 0 #ff8aa9,
                0 4px 6px -1px rgba(0, 0, 0, 0.2)
              `,
              border: "3px solid #4a2e3b",
              borderRadius: "999px",
            }}
          >
            <div className="absolute top-2 left-4 w-[10px] h-[3px] bg-white/90 rounded-[1px] shadow-[2px_2px_0_0_#ff8aa9]" />
            <span 
              className="text-[#4a2e3b] font-black tracking-[3px] uppercase mt-[2px] ml-1 group-active:translate-y-[1px] transition-transform"
              style={{ 
                fontSize: "1.2rem",
                fontFamily: "'Courier New', Courier, monospace"
              }}
            >
              {loading ? "..." : "OPEN PACK"}
            </span>
          </button>
        )}
      </div>

      <AnimatePresence>
        {isVideoPlaying && (
          <VideoPortal 
            onComplete={() => {
              setIsVideoPlaying(false);
              navigate("/reveal", { state: { cards: pulledCards } });
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function VideoPortal({ onComplete }: { onComplete: () => void }) {
  const [flash, setFlash] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleTimeUpdate = (e: SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = e.target as HTMLVideoElement;
    if (video.duration > 0 && (video.duration - video.currentTime) < 1.31) {
      setFlash(true);
    }
  };

  return createPortal(
    <>
      <audio autoPlay src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/PokeBall-8-bit.mp3" />
      {/* Background Overlay */}
      <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md pointer-events-none" />
      
      {/* Video Container with mix-blend-screen on the topmost stacking context */}
      <div className="fixed inset-0 z-[130] flex items-center justify-center pointer-events-none mix-blend-screen">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onTimeUpdate={handleTimeUpdate}
          onEnded={onComplete}
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 object-contain contrast-125"
          style={{ imageRendering: "pixelated" }}
          src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeBall-8-bit.webm"
        />
      </div>

      {/* Cinematic Flash Overlay */}
      <div 
        className={`fixed inset-0 bg-white pointer-events-none z-[140] transition-opacity duration-300 ease-in ${flash ? "opacity-100" : "opacity-0"}`}
      />
    </>,
    document.body
  );
}
