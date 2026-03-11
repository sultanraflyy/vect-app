const FREE_CREDITS = 150;
const STORAGE_KEY = 'vect_credits_used';

export const CREDIT_COSTS = {
  text: 1,
  url: 2,
  pdf: 3,
} as const;

export function getCreditsUsed(): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(STORAGE_KEY);
  return val ? parseInt(val, 10) : 0;
}

export function getCreditsLeft(): number {
  return Math.max(0, FREE_CREDITS - getCreditsUsed());
}

export function getTotalCredits(): number {
  return FREE_CREDITS;
}

export function useCredit(amount: number): boolean {
  const left = getCreditsLeft();
  if (left < amount) return false;
  const newUsed = getCreditsUsed() + amount;
  localStorage.setItem(STORAGE_KEY, newUsed.toString());
  return true;
}

export function hasEnoughCredits(amount: number): boolean {
  return getCreditsLeft() >= amount;
}
