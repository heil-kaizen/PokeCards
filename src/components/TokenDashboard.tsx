import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DollarSign, Droplets, Copy, Check } from "lucide-react";

interface TokenData {
  priceUsd: string;
  fdv: number;
  liquidity: number;
  volume24h: number;
  priceChange24h: number;
  name?: string;
  symbol?: string;
  imageUrl?: string;
  holders?: number;
  supply?: number;
}

function formatCurrency(num: number | undefined): string {
  if (num === undefined || num === 0) return "0.0M";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(1);
}

export function TokenDashboard() {
  const [data, setData] = useState<TokenData | null>(null);
  const [copied, setCopied] = useState(false);

  const CA = "coming soon";

  useEffect(() => {
    // Fetch live data from DexScreener using tokens endpoint
    const fetchToken = async () => {
      try {
        let priceUsd = "0";
        let fdv = 0;
        let liquidity = 0;
        let volume24h = 0;
        let priceChange24h = 0;
        let name = "";
        let symbol = "";
        let imageUrl = "";
        let holders = 0;
        let supply = 0;

        // Fetch from Solana Tracker via backend
        try {
          const stRes = await fetch(`/api/token-info/${CA}`);
          if (stRes.ok) {
            const stData = await stRes.json();
            
            // solanatracker.io price logic
            // Assuming structure info.token.* and price.*
            const tInfo = stData.info?.token;
            const tPrice = stData.price;
            
            if (tInfo || tPrice) {
              if (tPrice) {
                // Not sure exact response structure, trying to guess common patterns
                // price could be a number or an object
                priceUsd = typeof tPrice === 'number' ? tPrice.toString() : (tPrice.price || priceUsd).toString();
                fdv = tInfo?.fdv || tInfo?.marketCap || fdv;
                liquidity = tInfo?.liquidity || fdv;
              }
            }
            holders = tInfo?.holders || stData.info?.holders || holders;
            supply = tInfo?.supply || stData.info?.supply || supply;
            name = tInfo?.name || stData.info?.name || name;
            symbol = tInfo?.symbol || stData.info?.symbol || symbol;
             // Some responses might place market cap stats in stData.info directly
            if (stData.info?.marketCap) fdv = stData.info.marketCap;
            if (stData.info?.liquidity) liquidity = stData.info.liquidity;
            if (stData.info?.price) priceUsd = stData.info.price.toString();
          }
        } catch (e) {
          console.log("Solana Tracker API error:", e);
        }

        // Fetch from DexScreener specifically for image (and fallback data)
        try {
          const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${CA}`);
          const dexJson = await dexRes.json();
          const pair = dexJson.pairs?.[0]; // Get the most liquid pair
          
          if (pair) {
            if (!priceUsd || priceUsd === "0") priceUsd = pair.priceUsd;
            if (!fdv) fdv = pair.fdv;
            if (!liquidity) liquidity = pair.liquidity?.usd;
            volume24h = pair.volume?.h24 || 0;
            priceChange24h = pair.priceChange?.h24 || 0;
            if (!name) name = pair.baseToken?.name;
            if (!symbol) symbol = pair.baseToken?.symbol;
            imageUrl = pair.info?.imageUrl || imageUrl;
          }
        } catch (e) {
          console.log("DexScreener API fallback failed:", e);
        }

        if (!name) name = "Unknown Token";
        if (!symbol) symbol = "UNK";
        
        setData({
          priceUsd,
          fdv,
          liquidity,
          volume24h,
          priceChange24h,
          name,
          symbol,
          imageUrl,
          holders,
          supply
        });
      } catch (e) {
        console.error("Failed to fetch token data", e);
      }
    };
    fetchToken();
    const int = setInterval(fetchToken, 60000);
    return () => clearInterval(int);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(CA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-white px-6 py-6 flex flex-col md:flex-row items-start md:items-center justify-between pointer-events-auto gap-8 relative"
      style={{
        border: "4px solid #2d2d2d",
        boxShadow: "-2px 4px 0px 1px rgba(0,0,0,0.15)",
        borderRadius: "0px",
        fontFamily: "ByteBounce, monospace"
      }}
    >
      <div className="absolute -top-16 -right-10 md:-right-16 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 opacity-100 pointer-events-none" style={{ imageRendering: "pixelated" }}>
        <img src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/Pokemon%20GIF/lugia.gif" alt="Lugia" className="w-full h-full object-contain" />
      </div>

      <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 opacity-100 pointer-events-none z-0" style={{ imageRendering: "pixelated" }}>
        <img src="https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/Pokemon%20GIF/dragonite.gif" alt="Dragonite" className="w-full h-full object-contain" />
      </div>

      {/* Token Info Column */}
      <div className="flex flex-col gap-3 relative">
        <div 
          className="px-3 py-1 bg-[#f74170]/10 text-[#f74170] uppercase w-max mb-1"
          style={{ border: "2px solid #f74170", fontSize: "1.2rem", letterSpacing: "1px" }}
        >
          Live Ecosystem Stats
        </div>
        <div className="flex items-center gap-5">
          {data?.imageUrl && (
            <div className="w-16 h-16 bg-white overflow-hidden" style={{ border: "3px solid #2d2d2d", boxShadow: "-2px 3px 0px 0px rgba(0,0,0,0.15)" }}>
              <img src={data.imageUrl} alt="Token Logo" className="w-full h-full object-cover" style={{ imageRendering: "pixelated" }} />
            </div>
          )}
          <div className="flex flex-col items-start gap-1">
            <div className="text-4xl sm:text-5xl text-[#002f6c] flex items-center gap-3" style={{ textShadow: "2px 2px 0px rgba(0,0,0,0.1)" }}>
              {data ? `$${data.symbol}` : "Loading..."}
            </div>
            <button 
              onClick={handleCopy}
              className="text-xl text-[#003b87] flex items-center gap-2 cursor-pointer hover:text-[#f74170] transition-colors bg-transparent border-none p-0 relative group"
              title="Copy address"
              style={{ outline: "none" }}
            >
              {CA.slice(0, 6)}...{CA.slice(-4)}
              {copied ? <Check className="w-4 h-4 flex-shrink-0 text-[#2e7d32]" /> : <Copy className="w-4 h-4 flex-shrink-0" />}
              {copied && (
                <span className="absolute -bottom-6 left-0 text-[1.2rem] text-[#2e7d32]">
                  Copied!
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Columns */}
      <div className="flex items-center gap-8 sm:gap-10 md:gap-14 flex-wrap">
        <div className="flex flex-col gap-1">
          <span className="text-[1.3rem] text-[#003b87] uppercase">Price</span>
          <span className="text-3xl text-[#002f6c]" style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>${data ? parseFloat(data.priceUsd).toPrecision(4) : "0.00"}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[1.3rem] text-[#003b87] uppercase">MCAP</span>
          <span className="text-3xl text-[#002f6c]" style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>${formatCurrency(data?.fdv)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[1.3rem] text-[#003b87] uppercase">24H Vol</span>
          <span className="text-3xl text-[#002f6c]" style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>${formatCurrency(data?.volume24h)}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[1.3rem] text-[#003b87] uppercase">Change</span>
          <span className={`text-3xl ${!data || data.priceChange24h >= 0 ? "text-[#2e7d32]" : "text-rose-600"}`} style={{ textShadow: "1px 1px 0px rgba(0,0,0,0.1)" }}>
            {data?.priceChange24h !== undefined && data.priceChange24h > 0 ? "+" : ""}{data ? data.priceChange24h.toFixed(1) : "0.0"}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}
