// Credits are per-claim, not per-input type
// FREE plan = 150 credits/month
// Credit tracking is localStorage-based for free users
const FREE_CREDITS = 150;
const STORAGE_KEY = 'vect_credits_used';

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

/** Deduct `amount` credits from localStorage. Returns true if successful. */
export function useCredits(amount: number): boolean {
  const left = getCreditsLeft();
  if (left < amount) return false;
  const newUsed = getCreditsUsed() + amount;
  localStorage.setItem(STORAGE_KEY, newUsed.toString());
  return true;
}

/** Alias for backward compatibility */
export const useCredit = useCredits;

export function hasEnoughCredits(amount: number): boolean {
  return getCreditsLeft() >= amount;
}

export function resetCredits(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}
