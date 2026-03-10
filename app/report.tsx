import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, useColorScheme, Linking, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, CheckCircle2, AlertTriangle, HelpCircle, ExternalLink, ShareIcon } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useReports } from '@/providers/ReportsProvider';

export default function ReportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const { reports } = useReports();

  const report = reports.find(r => r.id === id);

  if (!report) {
    return (
      <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color={C.tint} strokeWidth={2} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.errorText, { color: C.textSecondary }]}>Report not found</Text>
        </View>
      </View>
    );
  }

  const getStatusIcon = (status: string) => {
    if (status === 'verified') return <CheckCircle2 size={16} color={C.success} strokeWidth={2} />;
    if (status === 'flagged') return <AlertTriangle size={16} color={C.error} strokeWidth={2} />;
    return <HelpCircle size={16} color={C.unverifiable} strokeWidth={2} />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'verified') return C.success;
    if (status === 'flagged') return C.error;
    return C.unverifiable;
  };

  const getStatusBg = (status: string) => {
    if (status === 'verified') return C.successLight;
    if (status === 'flagged') return C.errorLight;
    return C.unverifiableLight;
  };

  const getTrustColor = (score: number) => {
    if (score >= 80) return C.success;
    if (score >= 50) return C.warning;
    return C.error;
  };

  const handleShare = async () => {
    const statusEmoji = (status: string) =>
      status === 'verified' ? '✅' : status === 'flagged' ? '🚩' : '❓';

    const claimsList = report.claims
      .slice(0, 5)
      .map((c: any) => `${statusEmoji(c.status)} ${c.text}`)
      .join('\n');

    const trustLabel = report.trustScore >= 80 ? 'High Trust' : report.trustScore >= 50 ? 'Moderate Trust' : 'Low Trust';

    const message = `📋 Vect Verification Report
━━━━━━━━━━━━━━━━
${report.title}

Trust Score: ${report.trustScore}% (${trustLabel})
✅ Verified: ${report.verifiedCount} claims
🚩 Flagged: ${report.flaggedCount} claims

Top Claims:
${claimsList}

━━━━━━━━━━━━━━━━
Verified by Vect — Truth Infrastructure`;

    await Share.share({ message });
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={C.tint} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: C.text }]} numberOfLines={1}>
          Verification Report
        </Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <ShareIcon size={20} color={C.tint} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Trust Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: C.card, borderColor: C.border }]}>
          <Text style={[styles.reportTitle, { color: C.text }]} numberOfLines={2}>
            {report.title}
          </Text>
          <View style={styles.scoreRow}>
            <View>
              <Text style={[styles.scoreLabel, { color: C.textSecondary }]}>Trust Score</Text>
              <Text style={[styles.scoreValue, { color: getTrustColor(report.trustScore) }]}>
                {report.trustScore}%
              </Text>
            </View>
            <View style={styles.statsRight}>
              <View style={[styles.statBadge, { backgroundColor: C.successLight }]}>
                <CheckCircle2 size={13} color={C.success} strokeWidth={2} />
                <Text style={[styles.statBadgeText, { color: C.success }]}>
                  {report.verifiedCount} verified
                </Text>
              </View>
              <View style={[styles.statBadge, { backgroundColor: C.errorLight }]}>
                <AlertTriangle size={13} color={C.error} strokeWidth={2} />
                <Text style={[styles.statBadgeText, { color: C.error }]}>
                  {report.flaggedCount} flagged
                </Text>
              </View>
            </View>
          </View>

          {/* Trust bar */}
          <View style={[styles.trustTrack, { backgroundColor: C.surface }]}>
            <View style={[
              styles.trustFill,
              {
                width: `${report.trustScore}%`,
                backgroundColor: getTrustColor(report.trustScore)
              }
            ]} />
          </View>
        </View>

        {/* Claims */}
        <Text style={[styles.sectionTitle, { color: C.text }]}>
          Claims ({report.claims.length})
        </Text>

        <View style={[styles.claimsList, { backgroundColor: C.card, borderColor: C.border }]}>
          {report.claims.map((claim, i) => (
            <View
              key={claim.id}
              style={[
                styles.claimItem,
                i < report.claims.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }
              ]}
            >
              {/* Status badge */}
              <View style={[styles.claimStatus, { backgroundColor: getStatusBg(claim.status) }]}>
                {getStatusIcon(claim.status)}
                <Text style={[styles.claimStatusText, { color: getStatusColor(claim.status) }]}>
                  {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                </Text>
              </View>

              {/* Claim text */}
              <Text style={[styles.claimText, { color: C.text }]}>{claim.text}</Text>

              {/* Explanation */}
              {claim.explanation && (
                <Text style={[styles.claimExplanation, { color: C.textSecondary }]}>
                  {claim.explanation}
                </Text>
              )}

              {/* Confidence bar */}
              <View style={styles.confidenceRow}>
                <Text style={[styles.confidenceLabel, { color: C.textTertiary }]}>
                  Confidence
                </Text>
                <View style={[styles.confidenceTrack, { backgroundColor: C.surface }]}>
                  <View style={[
                    styles.confidenceFill,
                    {
                      width: `${claim.confidence}%`,
                      backgroundColor: getStatusColor(claim.status)
                    }
                  ]} />
                </View>
                <Text style={[styles.confidenceValue, { color: getStatusColor(claim.status) }]}>
                  {claim.confidence}%
                </Text>
              </View>

              {/* Sources */}
              {claim.sources && claim.sources.length > 0 && (
                <View style={styles.sources}>
                  <Text style={[styles.sourcesLabel, { color: C.textTertiary }]}>Sources</Text>
                  {claim.sources.slice(0, 2).map((src, si) => (
                    <TouchableOpacity 
                      key={si} 
                      style={[styles.sourceItem, { backgroundColor: C.surface }]}
                      onPress={() => src.url && Linking.openURL(src.url)}
                      activeOpacity={0.7}
                    >
                      <ExternalLink size={11} color={C.tint} strokeWidth={2} />
                      <Text style={[styles.sourceTitle, { color: C.tint }]} numberOfLines={1}>
                        {src.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  shareBtn: { width: 40, height: 40, alignItems: 'flex-end', justifyContent: 'center' },
  headerTitle: { fontSize: 15, fontWeight: '700', flex: 1, textAlign: 'center' },

  scroll: { padding: 16, gap: 14 },

  scoreCard: {
    borderRadius: 16, padding: 18,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
    gap: 12, borderWidth: 1,
  },
  reportTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, lineHeight: 22 },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2 },
  scoreValue: { fontSize: 40, fontWeight: '800', letterSpacing: -1 },
  statsRight: { gap: 6, alignItems: 'flex-end' },
  statBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100,
  },
  statBadgeText: { fontSize: 12, fontWeight: '600' },
  trustTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  trustFill: { height: '100%', borderRadius: 3 },

  sectionTitle: { fontSize: 16, fontWeight: '700', letterSpacing: -0.3, paddingHorizontal: 2 },

  claimsList: {
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    borderWidth: 1,
  },
  claimItem: { padding: 16, gap: 10 },
  claimStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 100,
  },
  claimStatusText: { fontSize: 12, fontWeight: '700' },
  claimText: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  claimExplanation: { fontSize: 13, lineHeight: 18 },

  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confidenceLabel: { fontSize: 11, fontWeight: '500', width: 70 },
  confidenceTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  confidenceFill: { height: '100%', borderRadius: 2 },
  confidenceValue: { fontSize: 11, fontWeight: '700', width: 35, textAlign: 'right' },

  sources: { gap: 6 },
  sourcesLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
  sourceItem: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    padding: 8, borderRadius: 8,
  },
  sourceTitle: { fontSize: 12, fontWeight: '500', flex: 1 },
});
