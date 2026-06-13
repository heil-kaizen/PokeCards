import { motion } from "motion/react";
import { useStore } from "../store/useStore";
import { CardItem } from "./Reveal";
import { Lock, Award, Star, Zap } from "lucide-react";

export function Vault() {
  const wallet = useStore(s => s.wallet);
  const cards = useStore(s => s.cards);
  const totalUniqueCards = useStore(s => s.totalUniqueCards);
  const isEligible = useStore(s => s.isEligible);

  if (!wallet) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="fixed inset-0 bg-slate-900/60 pointer-events-none -z-10 transition-opacity" />
        <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
          <Lock className="w-10 h-10 text-slate-300" />
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">Vault Locked</h2>
        <p className="text-slate-300 max-w-md">Connect your eligible wallet on the home page to access your collected cards and rewards.</p>
      </div>
    );
  }

  const epicCount = cards.filter(c => c.rarity === "Epic").length;
  const legendaryCount = cards.filter(c => c.rarity === "Legendary").length;
  // Calculate reward share based on new parameters
  const rewardShare = ((epicCount * 0.1) + (legendaryCount * 0.5)).toFixed(1); // %

  const uniqueCollected = new Set(cards.map(c => c.name)).size;
  const collectionProgress = totalUniqueCards > 0 ? (uniqueCollected / totalUniqueCards) * 100 : 0;

  const rarityOrder: Record<string, number> = {
    Legendary: 4,
    Epic: 3,
    Rare: 2,
    Common: 1
  };
  const sortedCards = [...cards].sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Dim overlay for Vault page ONLY that makes it dark enough for glows to pop */}
      <div className="fixed inset-0 bg-slate-900/60 pointer-events-none -z-10 transition-opacity" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex flex-col md:flex-row gap-6 items-center justify-between"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight drop-shadow-md">My Vault</h1>
          <p className="text-slate-300 mt-2 font-mono text-sm">{wallet}</p>
        </div>
        
        {/* Reward Dashboard Widget */}
        <div className="flex bg-slate-900/50 backdrop-blur-xl rounded-2xl shadow-xl border border-white/10 p-4 gap-6">
           <div className="flex flex-col items-center justify-center">
             <div className="flex items-center gap-1 text-slate-400 text-xs font-bold uppercase tracking-wider mb-1"><Award className="w-3 h-3"/> Eligibility</div>
             <div className={`font-bold ${isEligible ? 'text-emerald-400' : 'text-rose-400'}`}>
               {isEligible ? "ACTIVE" : "INACTIVE"}
             </div>
           </div>
           <div className="w-px bg-slate-700/50" />
           <div className="flex flex-col items-center justify-center">
             <div className="flex items-center gap-1 text-purple-300 text-xs font-bold uppercase tracking-wider mb-1"><Zap className="w-3 h-3"/> Reward Share</div>
             <div className="font-black text-xl text-purple-400">
               {rewardShare}%
             </div>
           </div>
           <div className="w-px bg-slate-700/50" />
           <div className="flex flex-col items-center justify-center">
             <div className="flex items-center gap-1 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1"><Star className="w-3 h-3"/> Top Tier</div>
             <div className="font-black text-xl text-amber-400">
               {legendaryCount} L / {epicCount} E
             </div>
           </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/5 p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold tracking-wide">Collection Progress</h3>
          <span className="text-slate-300 font-mono text-sm">
            {uniqueCollected} / {totalUniqueCards} Unique Cards
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-3">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${collectionProgress}%` }}></div>
        </div>
        <div className="mt-2 text-right text-xs text-indigo-400 font-bold uppercase">
          {collectionProgress.toFixed(1)}% Complete
        </div>
      </motion.div>

      {cards.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-sm rounded-3xl border border-white/10">
          <p className="text-slate-300">Your vault is empty. Open some packs!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {sortedCards.map((card, i) => (
            <motion.div
              key={card.id || i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex justify-center"
            >
              <CardItem card={card} className="w-full max-w-[260px]" />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
