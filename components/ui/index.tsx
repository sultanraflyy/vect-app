/**
 * components/ui/index.tsx
 * Shared premium primitives for Vect
 */

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { CheckCircle2, AlertTriangle, HelpCircle, Clock } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { ClaimStatus } from '@/types/vect';

// ─── Status pill ──────────────────────────────────────────────────────────────

export const StatusPill = ({
  status,
  size = 'md',
}: {
  status: ClaimStatus;
  size?: 'sm' | 'md';
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const config: Record<ClaimStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    verified:     { label: 'Verified',     color: C.success,       bg: C.successLight,       icon: CheckCircle2 },
    flagged:      { label: 'Flagged',      color: C.error,         bg: C.errorLight,         icon: AlertTriangle },
    unverifiable: { label: 'Unverifiable', color: C.unverifiable,  bg: C.unverifiableLight,  icon: HelpCircle },
    pending:      { label: 'Pending',      color: C.textSecondary, bg: C.surface,            icon: Clock },
  };

  const { label, color, bg, icon: Icon } = config[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        pillStyles.pill,
        { backgroundColor: bg },
        isSmall && pillStyles.pillSm,
      ]}
    >
      <Icon size={isSmall ? 11 : 13} color={color} strokeWidth={2.5} />
      <Text style={[pillStyles.label, { color }, isSmall && pillStyles.labelSm]}>
        {label}
      </Text>
    </View>
  );
};

const pillStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  pillSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '600',
  },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

export const Divider = ({ style }: { style?: ViewStyle }) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  return (
    <View
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: C.border },
        style,
      ]}
    />
  );
};

// ─── Card ─────────────────────────────────────────────────────────────────────

export const Card = ({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const cardStyle = [
    cardStyles.card,
    { backgroundColor: C.card, shadowColor: scheme === 'dark' ? '#000' : '#000' },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
});

// ─── Section label ────────────────────────────────────────────────────────────

export const SectionLabel = ({
  children,
  style,
}: {
  children: string;
  style?: TextStyle;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  return (
    <Text
      style={[
        {
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          color: C.textTertiary,
          paddingHorizontal: 2,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// ─── Confidence bar ───────────────────────────────────────────────────────────

export const ConfidenceBar = ({
  value,
  status,
}: {
  value: number; // 0–100
  status: ClaimStatus;
}) => {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const color =
    status === 'verified' ? C.success
    : status === 'flagged' ? C.error
    : status === 'unverifiable' ? C.unverifiable
    : C.textTertiary;

  return (
    <View style={barStyles.track}>
      <View
        style={[
          barStyles.fill,
          { width: `${value}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
};

const barStyles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
