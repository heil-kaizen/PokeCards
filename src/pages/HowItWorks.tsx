import { motion } from "motion/react";
import { Wallet, Sparkles, Gem, AlertTriangle } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Wallet,
      title: "1. Hold 500k Tokens",
      desc: "Acquire and hold at least 500,000 of the target simulation tokens in your Solana wallet. This marks you as eligible.",
      color: "text-[#002f6c]",
      bg: "bg-[#e1eeff]"
    },
    {
      icon: Sparkles,
      title: "2. Open Daily Packs",
      desc: "Visit the dashboard every 5 minutes to crack open a premium pack. Each pack contains 8 random cards.",
      color: "text-[#f74170]",
      bg: "bg-[#ffe0e9]"
    },
    {
      icon: Gem,
      title: "3. Collect & Earn",
      desc: "Build your vault. Epic cards grant 0.1% and Legendary cards grant 0.5% share. Complete a full 8-card legendary set for a massive 10% bonus share!",
      color: "text-[#2e7d32]",
      bg: "bg-[#e8f5e9]"
    },
    {
      icon: AlertTriangle,
      title: "4. Maintain Balance",
      desc: "If your wallet balance drops below 500,000 tokens, you will lose your eligibility to open packs and claim rewards.",
      color: "text-rose-600",
      bg: "bg-rose-100"
    }
  ];

  return (
    <div className="w-full mx-auto py-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16"
      >
        <div className="inline-block px-6 py-2 bg-white border-[4px] border-[#2d2d2d] shadow-[-4px_6px_0px_0px_rgba(0,0,0,0.15)] mb-6">
          <h2 
            className="text-4xl md:text-5xl text-[#002f6c] tracking-widest uppercase"
            style={{ fontFamily: "ByteBounce, monospace", textShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}
          >
            The Collector's Handbook
          </h2>
        </div>
        <p 
          className="text-2xl text-white mt-4 max-w-2xl mx-auto tracking-wide leading-relaxed"
          style={{ fontFamily: "ByteBounce, monospace", textShadow: "1px 1px 0px #2d2d2d, -1px -1px 0 #2d2d2d, 1px -1px 0 #2d2d2d, -1px 1px 0 #2d2d2d, 1px 1px 0 #2d2d2d" }}
        >
          Welcome to the premium retro collectible experience. Follow these simple rules to complete your vault.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#f4f7f2] p-8 flex flex-col items-start min-h-[220px]"
              style={{
                border: "4px solid #8e8a8d",
                boxShadow: "0px 6px 0px 0px rgba(0,0,0,0.1), inset 0px 4px 0px 0px rgba(255,255,255,0.8)",
                borderRadius: "0px"
              }}
            >
               <div className={`w-14 h-14 ${step.bg} flex items-center justify-center mb-6`} style={{ border: "4px solid #2d2d2d", boxShadow: "-2px 3px 0px 0px rgba(0,0,0,0.15)" }}>
                 <Icon className={`w-8 h-8 ${step.color}`} />
               </div>
               <h3 
                 className="text-3xl text-[#002f6c] mb-3 uppercase tracking-wide"
                 style={{ fontFamily: "ByteBounce, monospace", textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}
               >
                 {step.title}
               </h3>
               <p 
                 className="text-xl text-[#003b87] leading-tight"
                 style={{ fontFamily: "ByteBounce, monospace" }}
               >
                 {step.desc}
               </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
