import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";

export function Reveal() {
  const navigate = useNavigate();
  const location = useLocation();
  const cards = location.state?.cards || [];

  const handleClose = () => {
    window.dispatchEvent(new Event('close-reward'));
    navigate("/");
  };

  const rarityOrder: Record<string, number> = {
    Legendary: 4,
    Epic: 3,
    Rare: 2,
    Common: 1
  };
  const sortedCards = [...cards].sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className="min-h-[100dvh] w-full overflow-y-auto pt-16 pb-12 px-4 flex flex-col items-center justify-center relative z-10"
    >
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat bg-fixed blur-md scale-105"
        style={{ backgroundImage: 'url("https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/pokedex-background.webp")' }}
      />
      <div className="fixed inset-0 z-[-1] bg-black/50" />

      <motion.div 
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="fixed inset-0 bg-white pointer-events-none z-50"
      />

      <div className="w-full flex-1 flex flex-col items-center justify-center max-w-7xl mx-auto gap-8">
        <motion.h2 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-3xl md:text-5xl font-black text-white text-center tracking-widest uppercase drop-shadow-2xl shrink-0"
        >
          Cards Revealed
        </motion.h2>

        <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-5 md:gap-6 w-full content-center">
          {sortedCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5, y: 50, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
              transition={{ delay: 0.8 + i * 0.15, type: "spring", damping: 15 }}
              className="flex justify-center shrink-0"
            >
              <CardItem card={card} className="w-[min(28vw,20vh)] sm:w-[min(22vw,22vh)] md:w-[min(16vw,26vh)] lg:w-[min(12vw,28vh)] max-w-[200px]" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="w-full flex justify-center relative z-50 shrink-0 mt-4"
        >
          <button 
            type="button"
            onClick={handleClose}
            className="cursor-pointer relative px-6 py-2.5 hover:-translate-y-[1px] disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-[2px] transition-transform flex items-center justify-center group"
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
            <div className="absolute top-1.5 left-4 w-[8px] h-[3px] bg-white/90 rounded-[1px] shadow-[2px_2px_0_0_#ff8aa9]" />
            <span 
              className="text-[#4a2e3b] font-black tracking-widest uppercase mt-[2px] ml-1 group-active:translate-y-[1px] transition-transform"
              style={{ 
                fontSize: "0.95rem",
                fontFamily: "'Courier New', Courier, monospace"
              }}
            >
              return
            </span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

export function CardItem({ card, className }: { card: any, className?: string }) {
  const isLegendary = card.rarity === "Legendary";
  const isEpic = card.rarity === "Epic";
  const isRare = card.rarity === "Rare";

  return (
    <motion.div
      whileHover={{ scale: 1.05, rotateY: 5, rotateX: -5 }}
      whileTap={{ scale: 0.95 }}
      style={{ transformStyle: "preserve-3d" }}
      className={cn(
        "relative w-full aspect-[2.5/3.5] rounded-xl sm:rounded-2xl cursor-pointer group flex items-center justify-center p-1",
        className
      )}
    >
      {/* Outer Glows based on Rarity */}
      {isLegendary && (
        <div className="absolute inset-[-4px] bg-gradient-to-r from-yellow-300 via-amber-500 to-yellow-300 rounded-3xl blur-md opacity-80 animate-pulse" />
      )}
      {isEpic && (
        <div className="absolute inset-[-4px] bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-500 rounded-3xl blur-md opacity-80 animate-pulse" />
      )}
      {isRare && (
        <div className="absolute inset-[-2px] bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl blur opacity-60" />
      )}

      {/* Card Body */}
      <div className={cn(
        "absolute inset-0 bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-xl relative",
        !card.imageUrl && isLegendary && "bg-gradient-to-br from-amber-100 to-yellow-50",
        !card.imageUrl && isEpic && "bg-gradient-to-br from-fuchsia-50 to-purple-100",
        !card.imageUrl && isRare && "bg-gradient-to-br from-blue-50 to-cyan-50"
      )}>
        {/* Foil effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent -translate-x-[150%] transition-transform duration-700 ease-out group-hover:translate-x-[150%] z-20 pointer-events-none" />
        
        {card.imageUrl ? (
          <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
        ) : (
          <>
            {/* Image Placeholder */}
            <div className="absolute top-2 left-2 right-2 bottom-1/3 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-400 font-bold text-xl">
                  #{card.imageIdx}
                </div>
                
                {/* Animated aura for epic/legendary inside image */}
                {isEpic && <div className="absolute inset-0 mix-blend-overlay bg-gradient-to-t from-purple-500/50 object-cover opacity-60" />}
                {isLegendary && <div className="absolute inset-0 mix-blend-color-dodge bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-300/60 to-transparent opacity-80 animate-pulse" />}
            </div>
            
            {/* Card Info */}
            <div className="absolute bottom-4 inset-x-2 text-center">
               <h4 className="font-black text-sm tracking-tight text-slate-800 line-clamp-1">{card.name}</h4>
               <div className="mt-1 flex flex-col items-center justify-center gap-1">
                 <span className={cn(
                   "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm",
                   isLegendary ? "bg-amber-100 text-amber-700" :
                   isEpic ? "bg-purple-100 text-purple-700" :
                   isRare ? "bg-blue-100 text-blue-700" :
                   "bg-slate-100 text-slate-500"
                 )}>
                   {card.rarity}
                 </span>
                 {(isEpic || isLegendary) && (
                   <span className={cn(
                     "text-[9px] font-black tracking-widest uppercase",
                     isLegendary ? "text-amber-600 drop-shadow-sm" : "text-purple-600 drop-shadow-sm"
                   )}>
                     +{isLegendary ? '0.5' : '0.1'}% Share
                   </span>
                 )}
               </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
