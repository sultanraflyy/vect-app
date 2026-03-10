import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { VerificationReport, Claim } from '@/types/vect';
import { supabase } from '@/lib/supabase';

interface ReportsContextType {
  reports: VerificationReport[];
  isLoading: boolean;
  createReport: (
    title: string,
    content: string,
    inputType: 'text' | 'url' | 'pdf',
    sourceUrl?: string,
    fileName?: string
  ) => Promise<string>;
  updateReport: (id: string, updates: Partial<VerificationReport>) => Promise<void>;
  addClaimsToReport: (id: string, claims: Claim[], creditsUsed: number) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const ReportsContext = createContext<ReportsContextType | null>(null);

export function ReportsProvider({ children }: { children: ReactNode }) {
  const [reports, setReports] = useState<VerificationReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: VerificationReport[] = (data || []).map((r: any) => ({
        id: r.id,
        title: r.title || 'Untitled',
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        trustScore: r.trust_score || 0,
        verifiedCount: r.verified_count || 0,
        flaggedCount: r.flagged_count || 0,
        inputType: r.input_type || 'text',
        sourceUrl: r.source_url,
        fileName: r.file_name,
        creditsUsed: r.credits_used || 0,
        claims: r.claims || [],
      }));

      setReports(mapped);
    } catch (e) {
      console.log('Failed to fetch reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Listen for auth changes and refetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchReports();
    });

    fetchReports();
    return () => subscription.unsubscribe();
  }, []);

  const createReport = async (
    title: string,
    content: string,
    inputType: 'text' | 'url' | 'pdf',
    sourceUrl?: string,
    fileName?: string
  ): Promise<string> => {
    try {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('reports')
        .insert({
          title,
          input_text: content.slice(0, 5000),
          input_type: inputType,
          source_url: sourceUrl,
          file_name: fileName,
          status: 'pending',
          trust_score: 0,
          verified_count: 0,
          flagged_count: 0,
          claims: [],
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      const newReport: VerificationReport = {
        id: data.id,
        title,
        status: 'pending',
        createdAt: data.created_at,
        trustScore: 0,
        verifiedCount: 0,
        flaggedCount: 0,
        inputType,
        claims: [],
      };

      setReports(prev => [newReport, ...prev]);
      return data.id;
    } catch (e) {
      // IMPORTANT:
      // Do not create "local-*" reports because they are not persisted and will
      // become "Report not found" on refresh / deep link.
      throw e;
    }
  };

  const updateReport = async (id: string, updates: Partial<VerificationReport>) => {
    // No more local-* reports
    setReports(prev => prev.map(r => (r.id === id ? { ...r, ...updates } : r)));

    // Only persist status for now (matches existing behavior)
    if (!id.startsWith('local-')) {
      await supabase.from('reports').update({ status: updates.status }).eq('id', id);
    }
  };

  const addClaimsToReport = async (id: string, claims: Claim[], creditsUsed: number) => {
    // No more local-* reports
    const verified = claims.filter(c => c.status === 'verified').length;
    const flagged = claims.filter(c => c.status === 'flagged').length;
    const trustScore = Math.round((verified / Math.max(claims.length, 1)) * 100);

    setReports(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              claims,
              status: 'completed',
              trustScore,
              verifiedCount: verified,
              flaggedCount: flagged,
              creditsUsed,
              completedAt: new Date().toISOString(),
            }
          : r
      )
    );

    await supabase
      .from('reports')
      .update({
        claims,
        status: 'completed',
        trust_score: trustScore,
        verified_count: verified,
        flagged_count: flagged,
        credits_used: creditsUsed,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
  };

  return (
    <ReportsContext.Provider
      value={{
        reports,
        isLoading,
        createReport,
        updateReport,
        addClaimsToReport,
        refreshReports: fetchReports,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
}

export function useReports() {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
}
