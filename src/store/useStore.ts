import { create } from 'zustand';

interface UserState {
  wallet: string | null;
  isEligible: boolean;
  tokenBalance: number;
  connectWallet: (wallet: string) => Promise<void>;
  disconnectWallet: () => void;
  checkEligibility: (wallet: string) => Promise<void>;
  cards: any[];
  fetchVault: () => Promise<void>;
}

export const useStore = create<UserState>((set, get) => ({
  wallet: null,
  isEligible: false,
  tokenBalance: 0,
  cards: [],
  connectWallet: async (wallet: string) => {
    set({ wallet });
    await get().checkEligibility(wallet);
    await get().fetchVault();
  },
  disconnectWallet: () => {
    set({ wallet: null, isEligible: false, tokenBalance: 0, cards: [] });
  },
  checkEligibility: async (wallet: string) => {
    try {
      const res = await fetch('/api/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet })
      });
      const data = await res.json();
      set({ isEligible: data.isEligible, tokenBalance: data.amount });
    } catch (e) {
      console.error(e);
    }
  },
  fetchVault: async () => {
    const { wallet } = get();
    if (!wallet) return;
    try {
      const res = await fetch(`/api/vault/${wallet}`);
      const data = await res.json();
      set({ cards: data.cards || [] });
    } catch (e) {
      console.error(e);
    }
  }
}));
