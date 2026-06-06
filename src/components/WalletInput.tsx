import { useState } from "react";
import { motion } from "motion/react";
import { useStore } from "../store/useStore";
import { Wallet, ChevronRight, AlertCircle, CheckCircle2 } from "lucide-react";

export function WalletInput() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const connectWallet = useStore(s => s.connectWallet);
  const wallet = useStore(s => s.wallet);
  const isEligible = useStore(s => s.isEligible);
  const disconnectWallet = useStore(s => s.disconnectWallet);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || input.length < 32) return;
    setLoading(true);
    await connectWallet(input);
    setLoading(false);
  };

  if (wallet) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 bg-[#f4f7f2] flex flex-col items-center gap-4 relative"
        style={{
          border: "4px solid #8e8a8d",
          boxShadow: "0px 4px 0px 0px rgba(0,0,0,0.1)",
          fontFamily: "ByteBounce, monospace",
          borderRadius: "24px" // Large pill-like or dialog box rounded? The input is rounded-full, let's use rounded-3xl
        }}
      >
        <div className="flex items-center gap-3">
          {isEligible ? (
             <div className="w-14 h-14 bg-white flex items-center justify-center rounded-xl" style={{ border: "4px solid #2d2d2d", boxShadow: "-2px 3px 0px 0px rgba(0,0,0,0.15)" }}>
               <CheckCircle2 className="w-8 h-8 text-[#2e7d32]" />
             </div>
          ) : (
            <div className="w-14 h-14 bg-white flex items-center justify-center rounded-xl" style={{ border: "4px solid #2d2d2d", boxShadow: "-2px 3px 0px 0px rgba(0,0,0,0.15)" }}>
               <AlertCircle className="w-8 h-8 text-[#f74170]" />
             </div>
          )}
        </div>
        
        <div className="text-center mt-2">
          <h3 className="text-3xl text-[#002f6c] tracking-wide" style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>
            {isEligible ? "Wallet Eligible!" : "Not Eligible"}
          </h3>
          <p className="text-[#003b87] text-xl mt-2 max-w-[280px] mx-auto leading-tight">
            {isEligible 
              ? "You hold enough tokens to crack open packs." 
              : "You need at least 500,000 tokens to participate."}
          </p>
        </div>
        
        <div className="bg-white py-2 px-4 text-xl text-[#8e8a8d] truncate w-full text-center mt-2 border-2 border-[#8e8a8d] rounded-xl relative">
           <div className="absolute top-1 left-2 w-[4px] h-[4px] bg-white/50" />
          {wallet}
        </div>

        <button 
          onClick={disconnectWallet}
          className="text-xl text-[#f74170] hover:text-[#d93a62] hover:scale-105 transition-all mt-3 underline decoration-2 underline-offset-4"
        >
          Disconnect Wallet
        </button>
      </motion.div>
    );
  }

  return (
    <motion.form 
      onSubmit={handleSubmit}
      className="w-full max-w-md relative flex items-center"
    >
      <input 
        type="text" 
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Enter Solana Wallet Address..."
        className="w-full bg-[#f4f7f2] border-0 outline-none rounded-full py-4 pl-8 pr-[130px] shadow-sm text-lg placeholder:text-[#8a91a0] text-[#003b87]"
        style={{
          boxShadow: "0px 4px 0px 0px rgba(0,0,0,0.1), inset 0px 2px 0px 0px rgba(255,255,255,0.8)",
          fontFamily: "ByteBounce, monospace",
          fontSize: "1.4rem"
        }}
      />
      <div className="absolute right-2 flex items-center">
        <button 
          type="submit"
          disabled={loading || input.length < 32}
          className="relative px-6 py-2 disabled:opacity-75 active:mt-[4px] active:shadow-none transition-all flex items-center justify-center group outline-none"
          style={{
            backgroundColor: input.length >= 32 ? "#f74170" : "#f88bab",
            boxShadow: input.length >= 32 ? "inset 0px -4px 0px 0px #b32a4e" : "inset 0px -4px 0px 0px #d8688a",
            border: "4px solid #8e8a8d",
            borderRadius: "999px",
            height: "46px"
          }}
        >
          <div className="absolute top-1.5 left-3 w-[6px] h-[3px] bg-white rounded-[1px]" />
          <span 
            className="text-white uppercase tracking-wide"
            style={{ 
              fontSize: "1.4rem",
              fontFamily: "ByteBounce, monospace",
              textShadow: "1px 1px 0px rgba(0,0,0,0.15)"
            }}
          >
            {loading ? "..." : "verify"}
          </span>
        </button>
      </div>
    </motion.form>
  );
}
