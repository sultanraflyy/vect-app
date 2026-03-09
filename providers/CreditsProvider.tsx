import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CreditBalance } from '@/types/vect';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_VERIFICATIONS = 150; // Free plan = 150 credits/month
const STORAGE_KEY = 'vect_credits_used';

export const CREDIT_COSTS = {
  text: 1,
  url: 2,
  pdf: 3,
};

interface CreditsContextType {
  credits: CreditBalance;
  creditsUsed: number;
  creditsLeft: number;
  isFreeUser: boolean;
  useCredit: (amount: number) => Promise<boolean>;
  hasEnoughCredits: (amount: number) => boolean;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function CreditsProvider({ children }: { children: ReactNode }) {
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [credits] = useState<CreditBalance>({
    balance: FREE_VERIFICATIONS,
    plan: 'starter',
  });

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(val => {
      if (val) setCreditsUsed(parseInt(val));
    });
  }, []);

  const creditsLeft = Math.max(0, FREE_VERIFICATIONS - creditsUsed);
  const isFreeUser = credits.plan === 'starter';

  const hasEnoughCredits = (amount: number) => creditsLeft >= amount;

  const useCredit = async (amount: number): Promise<boolean> => {
    if (!hasEnoughCredits(amount)) return false;
    const newUsed = creditsUsed + amount;
    setCreditsUsed(newUsed);
    await AsyncStorage.setItem(STORAGE_KEY, newUsed.toString());
    return true;
  };

  return (
    <CreditsContext.Provider value={{
      credits: { ...credits, balance: creditsLeft },
      creditsUsed,
      creditsLeft,
      isFreeUser,
      useCredit,
      hasEnoughCredits,
    }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error('useCredits must be used within CreditsProvider');
  return ctx;
}
