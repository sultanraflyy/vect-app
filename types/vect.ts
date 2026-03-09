export type ClaimStatus = 'verified' | 'flagged' | 'unverifiable' | 'pending';

export type ClaimCategory =
  | 'statistic'
  | 'quote'
  | 'date'
  | 'entity'
  | 'medical'
  | 'legal'
  | 'general';

export interface ClaimSource {
  title: string;
  url: string;
  authorityScore: number; // 0-100
  publishedAt?: string;
}

export interface Claim {
  id: string;
  text: string;
  status: ClaimStatus;
  confidence: number; // 0-100
  category: ClaimCategory;
  sources?: ClaimSource[];
  explanation?: string;
}

export interface VerificationReport {
  id: string;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  claims: Claim[];
  trustScore: number; // 0-100
  verifiedCount: number;
  flaggedCount: number;
  inputType: 'text' | 'url' | 'pdf';
  sourceUrl?: string;
  fileName?: string;
  creditsUsed?: number;
}

export interface CreditBalance {
  balance: number;
  plan: 'starter' | 'pro' | 'enterprise';
  renewsAt?: string;
}
