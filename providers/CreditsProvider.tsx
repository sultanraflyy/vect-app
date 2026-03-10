import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import { CreditBalance } from '@/types/vect';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FREE_VERIFICATIONS = 150; // Free plan = 150 credits/month
const STORAGE_KEY = 'vect_credits_used';

const getItem = async (key: string): Promise<string | null> =>
  Platform.OS === 'web' ? localStorage.getItem(key) : AsyncStorage.getItem(key);

const setItem = async (key: string, val: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(key, val);
  } else {
    await AsyncStorage.setItem(key, val);
  }
};

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
    getItem(STORAGE_KEY).then(val => {
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
    await setItem(STORAGE_KEY, newUsed.toString());
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
