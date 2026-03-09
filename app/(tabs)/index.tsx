import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
  Dimensions,
} from 'react-native';
import {
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  Shield,
  Zap,
  Coins,
  Plus,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useReports } from '@/providers/ReportsProvider';
import { useCredits } from '@/providers/CreditsProvider';
import { VerificationReport, ClaimStatus } from '@/types/vect';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Mini Trust Ring ──────────────────────────────────────────────────────────

const TrustRing = ({
  score,
  size = 64,
  strokeWidth = 5,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const getColor = (s: number) => {
    if (s >= 80) return C.success;
    if (s >= 50) return C.warning;
    return C.error;
  };

  const color = getColor(score);
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* We simulate SVG with an absolutely-positioned ring via border trick */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: `${color}20`,
          position: 'absolute',
        }}
      />
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: color,
          borderTopColor: 'transparent',
          borderRightColor: score > 50 ? color : 'transparent',
          position: 'absolute',
          transform: [{ rotate: `${-90 + (score / 100) * 360 * 0.5}deg` }],
          opacity: 0.9,
        }}
      />
      <Text
        style={{
          fontSize: size * 0.24,
          fontWeight: '800',
          color,
          letterSpacing: -0.5,
        }}
      >
        {score}
      </Text>
    </View>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({
  icon: Icon,
  value,
  label,
  color,
  bgColor,
}: {
  icon: typeof FileText;
  value: string;
  label: string;
  color: string;
  bgColor: string;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.statCard, { backgroundColor: C.card }]}>
      <View style={[styles.statIconWrap, { backgroundColor: bgColor }]}>
        <Icon size={18} color={color} strokeWidth={2} />
      </View>
      <Text style={[styles.statValue, { color: C.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: C.textTertiary }]}>{label}</Text>
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader = ({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: C.text }]}>{title}</Text>
      {action && onAction && (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.sectionAction, { color: C.tint }]}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// ─── Status config ────────────────────────────────────────────────────────────

function getStatusMeta(status: ClaimStatus, scheme: 'light' | 'dark') {
  const C = Colors[scheme];
  switch (status) {
    case 'verified':
      return { icon: CheckCircle2, color: C.success, bg: C.successLight, label: 'Verified' };
    case 'flagged':
      return { icon: AlertTriangle, color: C.error, bg: C.errorLight, label: 'Flagged' };
    case 'unverifiable':
      return { icon: HelpCircle, color: C.unverifiable, bg: C.unverifiableLight, label: 'Unclear' };
    default:
      return { icon: Clock, color: C.textSecondary, bg: C.surface, label: 'Pending' };
  }
}

function reportStatus(report: VerificationReport): ClaimStatus {
  if (report.status !== 'completed') return 'pending';
  if (report.trustScore >= 80) return 'verified';
  if (report.trustScore >= 50) return 'unverifiable';
  return 'flagged';
}

// ─── Report Row ───────────────────────────────────────────────────────────────

const ReportRow = ({
  report,
  onPress,
  isLast,
}: {
  report: VerificationReport;
  onPress: () => void;
  isLast: boolean;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const s = reportStatus(report);
  const meta = getStatusMeta(s, scheme);
  const StatusIcon = meta.icon;

  return (
    <TouchableOpacity
      style={[
        styles.reportRow,
        { backgroundColor: C.card },
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.separator },
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {/* Status icon */}
      <View style={[styles.reportIcon, { backgroundColor: meta.bg }]}>
        <StatusIcon size={17} color={meta.color} strokeWidth={2} />
      </View>

      {/* Info */}
      <View style={styles.reportInfo}>
        <Text style={[styles.reportTitle, { color: C.text }]} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={[styles.reportMeta, { color: C.textTertiary }]}>
          {new Date(report.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}{' '}
          · {report.claims.length} claim{report.claims.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Score / status */}
      <View style={styles.reportTrailing}>
        {report.status === 'completed' ? (
          <Text style={[styles.reportScore, { color: meta.color }]}>
            {report.trustScore}%
          </Text>
        ) : (
          <View style={[styles.processingDot, { backgroundColor: C.tint }]} />
        )}
        <ChevronRight size={16} color={C.textTertiary} strokeWidth={2} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Average Score Card ───────────────────────────────────────────────────────

const AverageScoreCard = ({ score, count }: { score: number; count: number }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const getLabel = (s: number) => {
    if (s >= 80) return 'Strong trust profile';
    if (s >= 60) return 'Moderate trust level';
    if (s >= 40) return 'Mixed results';
    return 'Low trust — review required';
  };

  const color = score >= 80 ? C.success : score >= 50 ? C.warning : C.error;

  return (
    <View style={[styles.scoreCard, { backgroundColor: C.card }]}>
      <View style={styles.scoreCardLeft}>
        <View style={[styles.scoreCardIcon, { backgroundColor: C.tintLight }]}>
          <Shield size={16} color={C.tint} strokeWidth={2} />
        </View>
        <Text style={[styles.scoreCardTitle, { color: C.textSecondary }]}>
          Avg. Trust Score
        </Text>
        <Text style={[styles.scoreCardValue, { color }]}>{score}%</Text>
        <Text style={[styles.scoreCardSub, { color: C.textTertiary }]}>
          {getLabel(score)} · {count} report{count !== 1 ? 's' : ''}
        </Text>
      </View>
      <TrustRing score={score} size={72} strokeWidth={6} />
    </View>
  );
};

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ onAction }: { onAction: () => void }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <View style={[styles.emptyWrap, { backgroundColor: C.card }]}>
      <View style={[styles.emptyIcon, { backgroundColor: C.tintLight }]}>
        <Shield size={28} color={C.tint} strokeWidth={1.5} />
      </View>
      <Text style={[styles.emptyTitle, { color: C.text }]}>No verifications yet</Text>
      <Text style={[styles.emptyDesc, { color: C.textSecondary }]}>
        Verify a document, article, or claim to build your trust profile.
      </Text>
      <TouchableOpacity
        style={[styles.emptyBtn, { backgroundColor: C.tint }]}
        onPress={onAction}
        activeOpacity={0.8}
      >
        <Plus size={16} color="#fff" strokeWidth={2.5} />
        <Text style={styles.emptyBtnText}>Start verification</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const { reports } = useReports();
  const { credits } = useCredits();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const completedReports = reports.filter((r) => r.status === 'completed');
  const avgScore =
    completedReports.length > 0
      ? Math.round(
          completedReports.reduce((a, r) => a + r.trustScore, 0) / completedReports.length
        )
      : 0;

  const totalClaims = reports.reduce((a, r) => a + (r.claims?.length ?? 0), 0);
  const verifiedClaims = reports.reduce((a, r) => a + (r.claims?.filter((c: any) => c.status === 'verified').length ?? 0), 0);

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: C.text }]}>Vect</Text>
          <Text style={[styles.headerSub, { color: C.textTertiary }]}>
            Truth Infrastructure
          </Text>
        </View>

        <View style={styles.headerRight}>
          {/* Credits pill */}
          <TouchableOpacity
            style={[
              styles.creditPill,
              {
                backgroundColor:
                  credits.balance === 0 ? C.errorLight : C.warningLight,
              },
            ]}
            onPress={() => router.push('/credits')}
            activeOpacity={0.7}
          >
            <Coins
              size={13}
              color={credits.balance === 0 ? C.error : C.warning}
              strokeWidth={2}
            />
            <Text
              style={[
                styles.creditText,
                { color: credits.balance === 0 ? C.error : C.warning },
              ]}
            >
              {credits.balance.toLocaleString()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.tint}
          />
        }
      >
        {/* ── Avg Score ── */}
        {completedReports.length > 0 && (
          <AverageScoreCard score={avgScore} count={completedReports.length} />
        )}

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatCard
            icon={FileText}
            value={reports.length.toString()}
            label="Reports"
            color={C.tint}
            bgColor={C.tintLight}
          />
          <StatCard
            icon={CheckCircle2}
            value={verifiedClaims.toString()}
            label="Verified"
            color={C.success}
            bgColor={C.successLight}
          />
          <StatCard
            icon={Zap}
            value={totalClaims.toString()}
            label="Claims"
            color={C.warning}
            bgColor={C.warningLight}
          />
        </View>

        {/* ── Quick Action ── */}
        {reports.length === 0 && (
          <TouchableOpacity
            style={[styles.quickAction, { backgroundColor: C.tint }]}
            onPress={() => router.push('/verify')}
            activeOpacity={0.85}
          >
            <View style={styles.quickActionLeft}>
              <Shield size={20} color="#fff" strokeWidth={2} />
              <View>
                <Text style={styles.quickActionTitle}>Verify your first document</Text>
                <Text style={styles.quickActionSub}>Paste text, URL, or upload a file</Text>
              </View>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* ── Recent Reports ── */}
        <View style={styles.section}>
          <SectionHeader
            title="Recent Reports"
            action={reports.length > 0 ? 'New' : undefined}
            onAction={() => router.push('/verify')}
          />

          {reports.length === 0 ? (
            <EmptyState onAction={() => router.push('/verify')} />
          ) : (
            <View style={[styles.reportList, { backgroundColor: C.card }]}>
              {reports.slice(0, 12).map((r, i) => (
                <ReportRow
                  key={r.id}
                  report={r}
                  isLast={i === Math.min(reports.length, 12) - 1}
                  onPress={() => router.push(`/report?id=${r.id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* bottom breathing room */}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  creditPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 100,
  },
  creditText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 16,
    gap: 12,
  },

  // Score card
  scoreCard: {
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  scoreCardLeft: {
    flex: 1,
    gap: 3,
  },
  scoreCardIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  scoreCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  scoreCardValue: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 40,
  },
  scoreCardSub: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },

  // Quick action
  quickAction: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  quickActionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  quickActionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },

  // Section
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionAction: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Report list
  reportList: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  reportIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  reportInfo: {
    flex: 1,
    gap: 3,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  reportMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportScore: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  processingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.7,
  },

  // Empty
  emptyWrap: {
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '400',
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
});
