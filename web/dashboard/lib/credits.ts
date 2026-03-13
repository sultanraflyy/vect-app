import { supabase } from './supabase';

// Mengambil profil lengkap user
export async function getUserProfile() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return { credits_used: 0, credits_limit: 150, tier: 'free' };

  const { data, error } = await supabase
    .from('profiles')
    .select('credits_used, credits_limit, tier')
    .eq('id', session.user.id)
    .single();

  if (error || !data) return { credits_used: 0, credits_limit: 150, tier: 'free' };
  return data;
}

export async function getCreditsUsed(): Promise<number> {
  const profile = await getUserProfile();
  return profile.credits_used;
}

export async function getTotalCredits(): Promise<number> {
  const profile = await getUserProfile();
  return profile.credits_limit;
}

export async function getCreditsLeft(): Promise<number> {
  const profile = await getUserProfile();
  return Math.max(0, profile.credits_limit - profile.credits_used);
}

export async function useCredits(amount: number): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return false;

  const left = await getCreditsLeft();
  if (left < amount) return false;

  const used = await getCreditsUsed();
  
  const { error } = await supabase
    .from('profiles')
    .update({ credits_used: used + amount })
    .eq('id', session.user.id);

  if (error) return false;
  return true;
}

export const useCredit = useCredits;

export async function hasEnoughCredits(amount: number): Promise<boolean> {
  const left = await getCreditsLeft();
  return left >= amount;
}

export function resetCredits(): void {}
