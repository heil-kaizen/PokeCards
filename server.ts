import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// IN-MEMORY FALLBACK (if no db provided)
let inMemoryVault: Record<string, {
  wallet: string;
  cards: any[];
  lastOpenAt: number;
}> = {};

// Database setup
let pool: pg.Pool | null = null;
const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (dbUrl) {
  pool = new pg.Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  // init tables
  pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      wallet VARCHAR(255) PRIMARY KEY,
      last_open_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS eligible_wallets (
      wallet_address VARCHAR(255) PRIMARY KEY,
      token_balance NUMERIC,
      eligible BOOLEAN,
      last_checked_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS collected_cards (
      id SERIAL PRIMARY KEY,
      wallet_address VARCHAR(255),
      card_name VARCHAR(255),
      rarity VARCHAR(50),
      image_url VARCHAR(1024),
      obtained_at BIGINT
    );
    CREATE TABLE IF NOT EXISTS reward_holders (
      wallet_address VARCHAR(255) PRIMARY KEY,
      epic_count INT DEFAULT 0,
      legendary_count INT DEFAULT 0,
      reward_share_percent NUMERIC DEFAULT 0,
      current_cycle_eligible BOOLEAN DEFAULT false,
      next_cycle_eligible BOOLEAN DEFAULT false,
      times_eligible INT DEFAULT 0,
      is_blacklisted BOOLEAN DEFAULT false,
      created_at BIGINT
    );
    ALTER TABLE reward_holders ADD COLUMN IF NOT EXISTS times_eligible INT DEFAULT 0;
    ALTER TABLE reward_holders ADD COLUMN IF NOT EXISTS is_blacklisted BOOLEAN DEFAULT false;
    ALTER TABLE reward_holders ADD COLUMN IF NOT EXISTS last_rare_pull_time BIGINT;
    ALTER TABLE reward_holders ADD COLUMN IF NOT EXISTS set_boost_percent NUMERIC DEFAULT 0;
    ALTER TABLE collected_cards ADD COLUMN IF NOT EXISTS card_set VARCHAR(255);
    CREATE TABLE IF NOT EXISTS completed_sets (
      wallet_address VARCHAR(255),
      set_name VARCHAR(255),
      completed_at BIGINT,
      PRIMARY KEY (wallet_address, set_name)
    );
    CREATE TABLE IF NOT EXISTS reward_cycles (
      cycle_id SERIAL PRIMARY KEY,
      started_at BIGINT,
      eligibility_snapshot_at BIGINT,
      payout_ready_at BIGINT,
      completed BOOLEAN DEFAULT false,
      rewards_sent BOOLEAN DEFAULT false
    );
    ALTER TABLE reward_cycles ADD COLUMN IF NOT EXISTS rewards_sent BOOLEAN DEFAULT false;
  `).catch(console.error);
}

// Card Databases
const setCelebrations = [
  { name: "[Set] Cosmog", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Cosmog013.webp" },
  { name: "[Set] Flying Pikachu", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Flying-Pikachu006.webp" },
  { name: "[Set] Ho-Oh", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Ho-Oh001.webp" },
  { name: "[Set] Kyogre", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Kyroge003.webp" },
  { name: "[Set] Palkia", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Palkia004.webp" },
  { name: "[Set] Reshiram", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Reshiram002.webp" },
  { name: "[Set] Xerneas", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Xerneas012.webp" },
  { name: "[Set] Zekrom", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Celebrations%20(25th%20Anniversary)-2021/Zekrom010.webp" }
].map(c => ({...c, setName: "Celebrations (25th Anniversary)-2021"}));

const setStellar = [
  { name: "[Set] Area Zero Underdepths", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Area-Zero-Underdepths.webp" },
  { name: "[Set] Cinderace", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Cinderace.webp" },
  { name: "[Set] Galvantula", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Galvantula.webp" },
  { name: "[Set] Joltik", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Joltik.webp" },
  { name: "[Set] Lapras", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Lapras.webp" },
  { name: "[Set] Raboot", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Raboot.webp" },
  { name: "[Set] Squirtle", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Squirtle.webp" },
  { name: "[Set] Terapagos", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Card%20Set%20Reward/Scarlet%20%26%20Violet%E2%80%94Stellar%20Crown%20Expansion/Terapagos.webp" }
].map(c => ({...c, setName: "Scarlet & Violet—Stellar Crown Expansion"}));

const setCards = [...setCelebrations, ...setStellar];

const legendaryCards = [
  { name: "Giratina V", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Legendary%20Webp/Giratina%20V.webp" },
  { name: "Illustrator Pikachu", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Legendary%20Webp/Illustrator%20Pikachu.webp" },
  { name: "Mega Charizard X ex 125", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Legendary%20Webp/Mega%20Charizard%20X%20ex%20125.webp" },
  { name: "Rayquaza VMAX", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Legendary%20Webp/Rayquaza%20VMAX.webp" },
  { name: "Umbreon VMAX 215", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Legendary%20Webp/Umbreon%20VMAX%20215.webp" }
];

const epicCards = [
  { name: "Charizard ex", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Charizard%20ex.webp" },
  { name: "Gardevoir ex Full Art", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Gardevoir%20ex%20Full%20Art.webp" },
  { name: "Giratina VSTAR", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Giratina%20VSTAR%20.webp" },
  { name: "Lugia VSTAR", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Lugia%20VSTAR.webp" },
  { name: "Miraidon ex Full Art", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Miraidon%20ex%20Full%20Art.webp" },
  { name: "Origin Forme Dialga V", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Origin%20Forme%20Dialga%20V.webp" },
  { name: "Origin Forme Palkia V", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Origin%20Forme%20Palkia%20V.webp" },
  { name: "Rayquaza VMAX", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Rayquaza%20VMAX.webp" },
  { name: "Roaring Moon ex", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Roaring%20Moon%20ex.webp" },
  { name: "Terapagos ex", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Epic%20Webp/Terapagos%20ex.webp" }
];

const rareCards = [
  { name: "Articuno Holo", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Articuno%20Holo.webp" },
  { name: "Blissey ex", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Blissey%20ex.webp" },
  { name: "Chandelure", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Chandelure.webp" },
  { name: "Darkrai Holo", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Darkrai%20Holo.webp" },
  { name: "Dragonite", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Dragonite.webp" },
  { name: "Gengar", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Gengar.webp" },
  { name: "Hydreigon Cosmos Holo", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Hydreigon%20Cosmos%20Holo.webp" },
  { name: "Lucario", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Lucario.webp" },
  { name: "Metagross", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Metagross.webp" },
  { name: "Mewtwo Holo", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Mewtwo%20Holo.webp" },
  { name: "Moltres", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Moltres.webp" },
  { name: "Aegislash V", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/POKEMON%20AEGISLASH%20V.webp" },
  { name: "Scizor", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Scizor.webp" },
  { name: "Tyranitar Holo", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Tyranitar%20Holo.webp" },
  { name: "Zapdos ex", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Rare%20Webp/Zapdos%20ex.webp" }
];

const commonCards = [
  { name: "Aipom", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Aipom.webp" },
  { name: "Bulbasaur", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Bulbasaur.webp" },
  { name: "Charmander", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Charmander.webp" },
  { name: "Dratini", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Dratini.webp" },
  { name: "Eevee", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Eevee.webp" },
  { name: "Gastly", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Gastly.webp" },
  { name: "Gible", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Gible.webp" },
  { name: "Growlithe", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Growlithe%20.webp" },
  { name: "Houndour", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Houndour.webp" },
  { name: "Litwick", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Litwick.webp" },
  { name: "Machop", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Machop.webp" },
  { name: "Magikarp", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Magikarp.webp" },
  { name: "Mareep", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Mareep.webp" },
  { name: "Pidgey", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/PIDGEY.webp" },
  { name: "Psyduck", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Psyduck.webp" },
  { name: "Ralts", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Ralts.webp" },
  { name: "Riolu", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Riolu.webp" },
  { name: "Squirtle", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Squirtle.webp" },
  { name: "Swinub", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/Swinub.webp" },
  { name: "Mankey", url: "https://raw.githubusercontent.com/heil-kaizen/PokeCards/main/PokeCardsImg/Common%20Webp/mankey.webp" }
];

// Randomizer helpers
const rarities = [
  { type: "Common", chance: 69 },
  { type: "Rare", chance: 20 },
  { type: "Epic", chance: 8 },
  { type: "Legendary", chance: 2 },
  { type: "SetLegendary", chance: 1 }
];

const pickRarity = () => {
  const r = Math.random() * 100;
  let acc = 0;
  for (const rar of rarities) {
    acc += rar.chance;
    if (r <= acc) return rar.type;
  }
  return "Common";
};

// API: Check eligibility
app.post("/api/eligibility", async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet required" });

    if (wallet === "BuVn8omjPiu11nd2NTDChTYjUZ7vESaN5fq8DiyaszXx") {
      return res.json({ isEligible: true, amount: 9999999, simulated: true });
    }

    const heilusKey = process.env.HELIUS_API_KEY;
    const targetToken = process.env.TARGET_TOKEN_ADDRESS_SOLANA || "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // Bonk
    
    const handleEligibilityResult = async (isEligible: boolean, amount: number, isSimulated: boolean = false) => {
      if (pool) {
        await pool.query(
          "INSERT INTO eligible_wallets (wallet_address, token_balance, eligible, last_checked_at) VALUES ($1, $2, $3, $4) ON CONFLICT (wallet_address) DO UPDATE SET token_balance = $2, eligible = $3, last_checked_at = $4",
          [wallet, amount, isEligible, Date.now()]
        );
      }
      return res.json({ isEligible, amount, simulated: isSimulated });
    };

    if (heilusKey) {
      // Helius requires a try catch internally for the fetch, but we also wrap it
      try {
        const resp = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heilusKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "getTokenAccountsByOwner",
            params: [
              wallet,
              { mint: targetToken },
              { encoding: "jsonParsed" }
            ]
          })
        });
        const data = await resp.json() as any;
        if (data.error) {
          console.error("Helius API returned an error:", data.error);
          return res.status(500).json({ error: "Helius API error: " + data.error.message });
        }
        
        let totalAmount = 0;
        if (data?.result?.value && Array.isArray(data.result.value)) {
           for (const acc of data.result.value) {
              const amountStr = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString || "0";
              totalAmount += parseFloat(amountStr);
           }
        }
        
        const minTokenAmount = parseFloat(process.env.MIN_TOKEN_AMOUNT || "500000");
        const isEligible = totalAmount >= minTokenAmount;
        
        console.log(`[Eligibility Check] Wallet: ${wallet} | Token: ${targetToken} | Balance Found: ${totalAmount} | Required: ${minTokenAmount} | Eligible: ${isEligible}`);
        
        return await handleEligibilityResult(isEligible, totalAmount);
      } catch (e) {
        console.error("Helius API error:", e);
        return await handleEligibilityResult(false, 0, false);
      }
    } else {
      console.error("No Helius API key provided.");
      return await handleEligibilityResult(false, 0, false);
    }
  } catch (error) {
    console.error("Error checking eligibility:", error);
    return res.status(500).json({ error: "Server error checking eligibility" });
  }
});

app.post("/api/pack/status", async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet required" });

    if (wallet === "BuVn8omjPiu11nd2NTDChTYjUZ7vESaN5fq8DiyaszXx") {
      return res.json({ canOpen: true });
    }

    let lastOpenAt = 0;
    let isEligible = false;
    
    if (pool) {
      const elR = await pool.query("SELECT eligible FROM eligible_wallets WHERE wallet_address = $1", [wallet]);
      if (elR.rows.length > 0 && elR.rows[0].eligible) {
         isEligible = true;
      }
      const r = await pool.query("SELECT last_open_at FROM users WHERE wallet = $1", [wallet]);
      if (r.rows.length > 0) lastOpenAt = parseInt(r.rows[0].last_open_at) || 0;
    } else {
      lastOpenAt = inMemoryVault[wallet]?.lastOpenAt || 0;
      isEligible = true;
    }

    const now = Date.now();
    const cooldownMs = 5 * 60 * 1000;
    const elapsed = now - lastOpenAt;
    const timeRemaining = Math.max(0, cooldownMs - elapsed);

    return res.json({ timeRemaining, canOpen: timeRemaining === 0 && isEligible });
  } catch (error) {
    console.error("Error fetching status:", error);
    return res.status(500).json({ error: "Server error fetching status" });
  }
});

app.post("/api/pack/open", async (req, res) => {
  try {
    const { wallet } = req.body;
    if (!wallet) return res.status(400).json({ error: "Wallet required" });

    if (wallet === "BuVn8omjPiu11nd2NTDChTYjUZ7vESaN5fq8DiyaszXx") {
      const generated = [
        {
          rarity: "Common",
          name: commonCards[0].name,
          imageIdx: 1,
          imageUrl: commonCards[0].url
        },
        {
          rarity: "Rare",
          name: rareCards[0].name,
          imageIdx: 1,
          imageUrl: rareCards[0].url
        },
        {
          rarity: "Epic",
          name: epicCards[0].name,
          imageIdx: 1,
          imageUrl: epicCards[0].url
        },
        {
          rarity: "Legendary",
          name: legendaryCards[0].name,
          imageIdx: 1,
          imageUrl: legendaryCards[0].url
        },
        {
          rarity: "SetLegendary",
          name: setCards[0].name,
          imageIdx: 1,
          imageUrl: setCards[0].url,
          cardSet: setCards[0].setName
        }
      ];
      // Do not save to DB for dev wallet
      return res.json({ cards: generated });
    }

    let lastOpenAt = 0;
    if (pool) {
      const elR = await pool.query("SELECT eligible FROM eligible_wallets WHERE wallet_address = $1", [wallet]);
      if (elR.rows.length === 0 || !elR.rows[0].eligible) {
          return res.status(403).json({ error: "Wallet is not eligible to open packs. Must hold the target asset." });
      }

      const r = await pool.query("SELECT last_open_at FROM users WHERE wallet = $1", [wallet]);
      if (r.rows.length > 0) lastOpenAt = parseInt(r.rows[0].last_open_at) || 0;
    } else {
      lastOpenAt = inMemoryVault[wallet]?.lastOpenAt || 0;
    }

    const now = Date.now();
    const cooldownMs = 5 * 60 * 1000;
    
    if (now - lastOpenAt < cooldownMs) {
      return res.status(400).json({ error: "Pack is on cooldown!" });
    }

    // Generate 8 cards (at least 1 rare)
  let generated = Array.from({length: 8}).map(() => {
    let rarity = pickRarity();
    let name = "Mystic Token Card";
    let imageUrl = null;
    let cardSet = null;
    
    if (rarity === "Legendary") {
      const g = legendaryCards[Math.floor(Math.random() * legendaryCards.length)];
      name = g.name;
      imageUrl = g.url;
    } else if (rarity === "SetLegendary") {
      const g = setCards[Math.floor(Math.random() * setCards.length)];
      name = g.name;
      imageUrl = g.url;
      cardSet = g.setName;
    } else if (rarity === "Epic") {
      const g = epicCards[Math.floor(Math.random() * epicCards.length)];
      name = g.name;
      imageUrl = g.url;
    } else if (rarity === "Rare") {
      const g = rareCards[Math.floor(Math.random() * rareCards.length)];
      name = g.name;
      imageUrl = g.url;
    } else if (rarity === "Common") {
      const g = commonCards[Math.floor(Math.random() * commonCards.length)];
      name = g.name;
      imageUrl = g.url;
    }

    return {
      rarity,
      name,
      imageIdx: Math.floor(Math.random() * 10) + 1,
      imageUrl,
      cardSet
    };
  });

  const hasRareOrBetter = generated.some(c => c.rarity !== "Common");
  if (!hasRareOrBetter) {
    generated[0].rarity = "Rare"; // Guarantee!
    const g = rareCards[Math.floor(Math.random() * rareCards.length)];
    generated[0].name = g.name;
    generated[0].imageUrl = g.url;
  }

  // Shuffle
  generated = generated.sort(() => Math.random() - 0.5);

  let pulledEpic = 0;
  let pulledLegendary = 0;

  if (pool) {
    await pool.query("INSERT INTO users (wallet, last_open_at) VALUES ($1, $2) ON CONFLICT (wallet) DO UPDATE SET last_open_at = $2", [wallet, now]);
    for (const c of generated) {
      if (c.rarity === "Epic") pulledEpic++;
      if (c.rarity === "Legendary" || c.rarity === "SetLegendary") pulledLegendary++;

      await pool.query(
        "INSERT INTO collected_cards (wallet_address, card_name, rarity, image_url, obtained_at, card_set) VALUES ($1, $2, $3, $4, $5, $6)",
        [wallet, c.name, c.rarity, c.imageUrl, now, c.cardSet || null]
      );
    }
    
    // Cycle and reward logic
    // Check for set completion
    let addedSetBoost = 0;
    const distinctCardsRes = await pool.query(
      "SELECT card_set, COUNT(DISTINCT card_name) as cnt FROM collected_cards WHERE wallet_address = $1 AND card_set IS NOT NULL GROUP BY card_set",
      [wallet]
    );
    for (const row of distinctCardsRes.rows) {
      if (parseInt(row.cnt) >= 8) { // each set has 8 cards
        const setName = row.card_set;
        const isCompletedRes = await pool.query("SELECT * FROM completed_sets WHERE wallet_address = $1 AND set_name = $2", [wallet, setName]);
        if (isCompletedRes.rows.length === 0) {
          await pool.query("INSERT INTO completed_sets (wallet_address, set_name, completed_at) VALUES ($1, $2, $3)", [wallet, setName, now]);
          addedSetBoost += 10; // 10% boost per completed set
        }
      }
    }

    if (pulledEpic > 0 || pulledLegendary > 0 || addedSetBoost > 0) {
      let activeCycleRes = await pool.query("SELECT * FROM reward_cycles WHERE completed = false ORDER BY cycle_id DESC LIMIT 1");
      let cycle = activeCycleRes.rows[0];
      
      if (!cycle) {
        cycle = (await pool.query("INSERT INTO reward_cycles (started_at) VALUES ($1) RETURNING *", [now])).rows[0];
      }
      
      const cycleStart = parseInt(cycle.started_at);
      const isFirst10Mins = now - cycleStart <= 10 * 60 * 1000;
      
      const addedPercent = pulledEpic * 0.1 + pulledLegendary * 0.5 + addedSetBoost;
      
      await pool.query(`
        INSERT INTO reward_holders (
          wallet_address, 
          epic_count, 
          legendary_count, 
          reward_share_percent, 
          current_cycle_eligible, 
          next_cycle_eligible, 
          created_at,
          last_rare_pull_time,
          set_boost_percent
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (wallet_address) DO UPDATE SET
          epic_count = reward_holders.epic_count + EXCLUDED.epic_count,
          legendary_count = reward_holders.legendary_count + EXCLUDED.legendary_count,
          reward_share_percent = reward_holders.reward_share_percent + EXCLUDED.reward_share_percent,
          current_cycle_eligible = CASE WHEN EXCLUDED.current_cycle_eligible THEN TRUE ELSE reward_holders.current_cycle_eligible END,
          next_cycle_eligible = CASE WHEN EXCLUDED.next_cycle_eligible THEN TRUE ELSE reward_holders.next_cycle_eligible END,
          last_rare_pull_time = EXCLUDED.last_rare_pull_time,
          set_boost_percent = reward_holders.set_boost_percent + EXCLUDED.set_boost_percent
      `, [wallet, pulledEpic, pulledLegendary, addedPercent, isFirst10Mins, !isFirst10Mins, now, now, addedSetBoost]);
    }
  } else {
    // In-memory fallback
    if (!inMemoryVault[wallet]) {
      inMemoryVault[wallet] = { wallet, cards: [], lastOpenAt: 0 };
    }
    inMemoryVault[wallet].lastOpenAt = now;
    inMemoryVault[wallet].cards.push(...generated.map(c => ({...c, discovered_at: now})));
  }

  return res.json({ cards: generated });
  } catch (error) {
    console.error("Error opening pack:", error);
    return res.status(500).json({ error: "Server error during pack opening" });
  }
});

app.post("/api/admin/rewards", async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!pool) {
      return res.json({ holders: [] });
    }
    
    // Explicitly name columns to avoid ambiguity/type errors.
    const r = await pool.query(`
      SELECT 
        rh.wallet_address,
        rh.epic_count,
        rh.legendary_count,
        rh.reward_share_percent,
        rh.current_cycle_eligible,
        rh.next_cycle_eligible,
        rh.times_eligible,
        rh.is_blacklisted,
        rh.last_rare_pull_time,
        rh.set_boost_percent,
        ew.last_checked_at
      FROM reward_holders rh
      LEFT JOIN eligible_wallets ew ON rh.wallet_address = ew.wallet_address
      ORDER BY rh.reward_share_percent DESC
    `);
    
    return res.json({ holders: r.rows });
  } catch (error) {
    console.error("Admin fetch error:", error);
    return res.status(500).json({ error: "Server error fetching admin data" });
  }
});

app.post("/api/admin/rewards/blacklist", async (req, res) => {
  const { password, wallet, blacklist } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!pool) return res.status(500).json({ error: "DB not initialized" });
    
    await pool.query("UPDATE reward_holders SET is_blacklisted = $1 WHERE wallet_address = $2", [blacklist, wallet]);
    if (blacklist) {
      await pool.query("UPDATE reward_holders SET current_cycle_eligible = false, next_cycle_eligible = false WHERE wallet_address = $1", [wallet]);
    }
    return res.json({ success: true });
  } catch (err) {
    console.error("Blacklist error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/clear-db", async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!pool) return res.status(500).json({ error: "DB not initialized" });
    
    await pool.query("TRUNCATE TABLE users, eligible_wallets, collected_cards, reward_holders, reward_cycles RESTART IDENTITY CASCADE");
    
    return res.json({ success: true, message: "Database wiped successfully" });
  } catch (err) {
    console.error("Clear DB error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/admin/rewards/mark-sent", async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  if (password !== adminPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (!pool) return res.status(500).json({ error: "DB not initialized" });
    
    await pool.query("UPDATE reward_cycles SET rewards_sent = true WHERE completed = true AND rewards_sent = false");
    
    // Once rewards are sent, reset counts and share for users who were eligible so they start fresh
    // But wait, the cycles might be continuous. For now, just mark sent as requested.
    
    return res.json({ success: true });
  } catch (err) {
    console.error("Mark sent error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    if (!pool) return res.json({ leaderboard: [] });
    
    // get top 100 wallets by reward_share_percent
    const r = await pool.query(`
      SELECT wallet_address, reward_share_percent 
      FROM reward_holders 
      WHERE reward_share_percent > 0 AND is_blacklisted = false
      ORDER BY reward_share_percent DESC 
      LIMIT 100
    `);
    
    return res.json({ leaderboard: r.rows });
  } catch (err) {
    console.error("Leaderboard fetch error:", err);
    return res.status(500).json({ error: "Server error fetching leaderboard data" });
  }
});

app.get("/api/cycle/status", async (req, res) => {
  try {
    if (!pool) return res.json({ cycleRunning: false, completed: false, rewardsSent: false, timeLeftMs: 0 });
    
    const r = await pool.query("SELECT * FROM reward_cycles ORDER BY cycle_id DESC LIMIT 1");
    if (r.rows.length === 0) {
       return res.json({ cycleRunning: false, completed: false, rewardsSent: false, timeLeftMs: 0 });
    }
    const cycle = r.rows[0];
    const startedAt = parseInt(cycle.started_at);
    const now = Date.now();
    let timeLeftMs = 0;
    
    if (!cycle.completed) {
      timeLeftMs = Math.max(0, (15 * 60 * 1000) - (now - startedAt));
    }
    
    return res.json({
      cycleRunning: !cycle.completed,
      completed: cycle.completed,
      rewardsSent: cycle.rewards_sent,
      timeLeftMs
    });
  } catch (err) {
    console.error("Cycle status error:", err);
    return res.status(500).json({ error: "Server error fetching cycle status" });
  }
});

app.get("/api/vault/:wallet", async (req, res) => {
  try {
    const { wallet } = req.params;

    if (wallet === "BuVn8omjPiu11nd2NTDChTYjUZ7vESaN5fq8DiyaszXx") {
       const allMockCards = [
          { id: 1, rarity: "Common", name: commonCards[0].name, imageUrl: commonCards[0].url, discovered_at: Date.now() },
          { id: 2, rarity: "Rare", name: rareCards[0].name, imageUrl: rareCards[0].url, discovered_at: Date.now() },
          { id: 3, rarity: "Epic", name: epicCards[0].name, imageUrl: epicCards[0].url, discovered_at: Date.now() },
          { id: 4, rarity: "Legendary", name: legendaryCards[0].name, imageUrl: legendaryCards[0].url, discovered_at: Date.now() },
          { id: 5, rarity: "SetLegendary", name: setCards[0].name, imageUrl: setCards[0].url, discovered_at: Date.now(), cardSet: setCards[0].setName }
       ];
       const totalUniqueCards = commonCards.length + rareCards.length + epicCards.length + legendaryCards.length + setCards.length;
       return res.json({ cards: allMockCards, totalUniqueCards });
    }

    let cards = [];
    if (pool) {
      const r = await pool.query("SELECT * FROM collected_cards WHERE wallet_address = $1 ORDER BY obtained_at DESC", [wallet]);
      cards = r.rows.map(row => ({
        id: row.id,
        wallet: row.wallet_address,
        rarity: row.rarity,
        name: row.card_name,
        imageUrl: row.image_url,
        discovered_at: row.obtained_at,
        cardSet: row.card_set
      }));
    } else {
      cards = (inMemoryVault[wallet]?.cards || []).sort((a,b) => b.discovered_at - a.discovered_at);
    }
    const totalUniqueCards = commonCards.length + rareCards.length + epicCards.length + legendaryCards.length + setCards.length;
    return res.json({ cards, totalUniqueCards });
  } catch (error) {
    console.error("Error fetching vault:", error);
    return res.status(500).json({ error: "Server error fetching collection" });
  }
});

app.get("/api/token-info/:tokenAddress", async (req, res) => {
  const { tokenAddress } = req.params;
  const apiKey = process.env.SOLANATRACKER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Missing SOLANATRACKER_API_KEY" });
  }

  try {
    const [infoRes, priceRes] = await Promise.all([
      fetch(`https://data.solanatracker.io/tokens/${tokenAddress}`, {
        headers: { "x-api-key": apiKey }
      }),
      fetch(`https://data.solanatracker.io/price?token=${tokenAddress}`, {
        headers: { "x-api-key": apiKey }
      })
    ]);

    const info = await infoRes.json();
    const price = await priceRes.json();

    return res.json({ info, price });
  } catch (error: any) {
    console.error("Token fetch error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Cycle processing cron
setInterval(async () => {
  if (!pool) return;
  const now = Date.now();
  
  try {
    const actRes = await pool.query("SELECT * FROM reward_cycles WHERE completed = false ORDER BY cycle_id DESC");
    if (actRes.rows.length === 0) return;
    
    const cycle = actRes.rows[0];
    const started = parseInt(cycle.started_at);
    
    // 10 minute mark: Freeze eligibility
    if (now - started >= 10 * 60 * 1000 && !cycle.eligibility_snapshot_at) {
      await pool.query("UPDATE reward_cycles SET eligibility_snapshot_at = $1 WHERE cycle_id = $2", [now, cycle.cycle_id]);
      
      // Recheck all currently eligible holders using Helius
      const holders = await pool.query("SELECT wallet_address FROM reward_holders WHERE current_cycle_eligible = true AND is_blacklisted = false");
      const heilusKey = process.env.HELIUS_API_KEY;
      const targetToken = process.env.TARGET_TOKEN_ADDRESS_SOLANA || "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
      
      if (heilusKey && holders.rows.length > 0) {
        for (const h of holders.rows) {
          try {
            const resp = await fetch(`https://mainnet.helius-rpc.com/?api-key=${heilusKey}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 1,
                method: "getTokenAccountsByOwner",
                params: [ h.wallet_address, { mint: targetToken }, { encoding: "jsonParsed" } ]
              })
            });
            const data = await resp.json() as any;
            if (data.error) {
               console.error("Helius API error during cron check for wallet", h.wallet_address, ":", data.error);
               continue; // Default fail-safe, don't strip user if API fails
            }
            
            let totalAmount = 0;
            if (data?.result?.value && Array.isArray(data.result.value)) {
               for (const acc of data.result.value) {
                  const amountStr = acc?.account?.data?.parsed?.info?.tokenAmount?.uiAmountString || "0";
                  totalAmount += parseFloat(amountStr);
               }
            }
            
            const minTokenAmount = parseFloat(process.env.MIN_TOKEN_AMOUNT || "500000");
            if (totalAmount < minTokenAmount) {
               // Remove from current eligibility
               await pool.query("UPDATE reward_holders SET current_cycle_eligible = false WHERE wallet_address = $1", [h.wallet_address]);
               await pool.query("UPDATE eligible_wallets SET eligible = false, token_balance = $1, last_checked_at = $2 WHERE wallet_address = $3", [totalAmount, now, h.wallet_address]);
            } else {
               await pool.query("UPDATE eligible_wallets SET token_balance = $1, last_checked_at = $2 WHERE wallet_address = $3", [totalAmount, now, h.wallet_address]);
            }
          } catch (e) {
            console.error("Helius recheck error:", e);
          }
        }
      }
    }
    
    // 15 minute mark: Complete and shift next_cycle back to current_cycle
    if (now - started >= 15 * 60 * 1000 && !cycle.payout_ready_at) {
      await pool.query("UPDATE reward_cycles SET payout_ready_at = $1, completed = true WHERE cycle_id = $2", [now, cycle.cycle_id]);
      
      // Increment times_eligible for anyone successfully eligible during this cycle
      await pool.query("UPDATE reward_holders SET times_eligible = times_eligible + 1 WHERE current_cycle_eligible = true AND is_blacklisted = false");

      
      // Move next_cycle_eligible users to current_cycle_eligible for the newly starting cycle logically,
      // But we just reset current_cycle_eligible = next_cycle_eligible, and next_cycle_eligible = false.
      // Wait, if we keep them in reward_holders, they will just carry over their exact share to the new current cycle?
      // Yes, "instead mark them for NEXT cycle eligibility. At exactly 15 minutes: begin waiting for next cycle."
      // BUT if the cycle is done, the rewards are paid/saved. The count resets?
      // Wait, the specification says "When FIRST Epic or Legendary card is pulled: start a NEW cycle."
      // So if people have next_cycle_eligible = true, do we start a new cycle immediately?
      // Let's reset the eligible flags and clear counts if they were paid, OR if we keep a historical record,
      // a robust system would probably sum for payout. "show payout list in Supabase".
      // We will leave the reward_holders table alone, just shift the flags.
      
      const hasNext = await pool.query("SELECT COUNT(*) as c FROM reward_holders WHERE next_cycle_eligible = true");
      await pool.query("UPDATE reward_holders SET current_cycle_eligible = current_cycle_eligible OR next_cycle_eligible, next_cycle_eligible = false");
      
      if (parseInt(hasNext.rows[0].c) > 0) {
        // start immediately if there's backlogged pulls
        await pool.query("INSERT INTO reward_cycles (started_at) VALUES ($1)", [now]);
      } else {
        // Also wipe counts for current_cycle_eligible? The user says "payout_ready_at". 
        // We'll leave it simple.
      }
    }
    
  } catch(e) {
    console.error("Cycle cron err:", e);
  }
}, 10000);

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
