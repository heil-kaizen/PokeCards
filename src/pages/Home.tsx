import { TokenDashboard } from "../components/TokenDashboard";
import { WalletInput } from "../components/WalletInput";
import { PackOpening } from "../components/PackOpening";
import { HowItWorks } from "./HowItWorks";
import { LeaderboardSection } from "../components/LeaderboardSection";
import { motion } from "motion/react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function Home() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      // Small timeout to allow layout to settle, but use 'instant' behavior to avoid smooth scrolling from top.
      const handle = setTimeout(() => {
        const el = document.getElementById(location.hash.slice(1));
        if (el) {
          el.scrollIntoView({ behavior: "instant" });
        }
      }, 50);
      return () => clearTimeout(handle);
    } else {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }, [location.hash]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 pb-24">
      {/* 1st Section: Dashboard */}
      <div id="dashboard" className="min-h-screen pt-32 mt-2 flex flex-col items-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16 space-y-6"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl tracking-widest text-white leading-[1.1]" style={{ fontFamily: "ByteBounce, monospace", textShadow: "4px 4px 0px rgba(0,0,0,0.15), 2px 2px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" }}>
            THE <span className="text-[#f74170]">POKEGRAILS</span> VAULT
          </h1>
          <p className="text-xl md:text-3xl text-white max-w-2xl mx-auto tracking-wide px-2" style={{ fontFamily: "ByteBounce, monospace", textShadow: "2px 2px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" }}>
            Welcome to the ultimate collector's experience. Track token metrics and unlock premium artifacts.
          </p>
        </motion.div>

        <div className="w-full">
          <TokenDashboard />
        </div>
      </div>

      {/* 2nd Section: Pack */}
      <div id="pack" className="min-h-screen pt-32 pb-16 relative">
        <div className="flex flex-col lg:flex-row gap-12 items-start justify-between w-full">
          <div className="flex-1 flex flex-col gap-10 max-w-xl">
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-6 text-center lg:text-left"
            >
              <h2 className="text-5xl md:text-7xl lg:text-8xl tracking-widest text-white leading-[1.1]" style={{ fontFamily: "ByteBounce, monospace", textShadow: "4px 4px 0px rgba(0,0,0,0.15), 2px 2px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" }}>
                CRACK OPEN <br className="hidden lg:block"/> THE <span className="text-[#f74170]">MAGIC</span>
              </h2>
              <p className="text-xl md:text-2xl text-white max-w-md mx-auto lg:mx-0 tracking-wide" style={{ fontFamily: "ByteBounce, monospace", textShadow: "1px 1px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" }}>
                Hold 500k tokens to unlock premium collector packs. Discover legendary artifacts, complete your vault, and earn rewards.
              </p>
            </motion.div>

            <div className="w-full">
              <WalletInput />
            </div>
          </div>

          <div className="w-full lg:w-[450px] shrink-0 flex justify-center lg:sticky lg:top-32">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
              className="w-full"
            >
              <PackOpening />
            </motion.div>
          </div>
        </div>
      </div>

      {/* 3rd Section: Leaderboard */}
      <div id="leaderboard" className="min-h-screen pt-32 pb-16 relative">
        <LeaderboardSection />
      </div>

      {/* 4th Section: How it works */}
      <div id="how-it-works" className="min-h-screen pt-32 pb-16 relative">
        <HowItWorks />
      </div>
    </div>
  );
}
