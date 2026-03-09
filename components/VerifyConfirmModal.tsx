import { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Easing, useColorScheme,
} from 'react-native';
import { Shield, Zap, ChevronRight, X, AlertTriangle, Layers } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface ScanResult {
  totalClaims: number;
  groupedClaims: number;
  uniqueClaims: number;
}

interface Props {
  visible: boolean;
  scanResult: ScanResult | null;
  creditsLeft: number;
  onClose: () => void;
  onVerify: (maxClaims: number) => void;
  onUpgrade: () => void;
}

const MAX_CLAIMS = 50;

export default function VerifyConfirmModal({
  visible, scanResult, creditsLeft, onClose, onVerify, onUpgrade,
}: Props) {
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const slideAnim = useRef(new Animated.Value(400)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 65, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 400, duration: 200, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!scanResult) return null;

  const { totalClaims, groupedClaims, uniqueClaims } = scanResult;
  const cappedClaims = Math.min(uniqueClaims, MAX_CLAIMS);
  const top25 = Math.min(25, cappedClaims);

  const canAffordAll = creditsLeft >= cappedClaims;
  const canAfford25 = creditsLeft >= top25;
  const hasAnyClaims = creditsLeft >= 1;

  const options = [
    {
      label: `Verify All`,
      sub: `${cappedClaims} unique claims`,
      cost: cappedClaims,
      highlight: true,
      disabled: !canAffordAll,
      onPress: () => onVerify(cappedClaims),
    },
    {
      label: `Top 25`,
      sub: `Highest-priority claims`,
      cost: top25,
      highlight: false,
      disabled: !canAfford25,
      onPress: () => onVerify(top25),
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[s.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
        <Animated.View style={[s.sheet, { backgroundColor: C.card, transform: [{ translateY: slideAnim }] }]}>

          {/* Handle */}
          <View style={[s.handle, { backgroundColor: C.border }]} />

          {/* Header */}
          <View style={s.header}>
            <View style={[s.headerIcon, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
              <Shield size={20} color="#0284C7" strokeWidth={2} />
            </View>
            <View style={s.headerText}>
              <Text style={[s.headerTitle, { color: C.text }]}>Ready to verify</Text>
              <Text style={[s.headerSub, { color: C.textSecondary }]}>Review before spending credits</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={[s.closeBtn, { backgroundColor: C.surface }]}>
              <X size={16} color={C.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Scan stats */}
          <View style={[s.statsRow, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.stat}>
              <Text style={[s.statVal, { color: C.text }]}>{totalClaims}</Text>
              <Text style={[s.statLbl, { color: C.textTertiary }]}>Found</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: C.border }]} />
            <View style={s.stat}>
              <View style={s.statWithIcon}>
                <Layers size={13} color="#0284C7" strokeWidth={2} />
                <Text style={[s.statVal, { color: '#0284C7' }]}>{groupedClaims}</Text>
              </View>
              <Text style={[s.statLbl, { color: C.textTertiary }]}>Grouped</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: C.border }]} />
            <View style={s.stat}>
              <Text style={[s.statVal, { color: C.text }]}>{uniqueClaims}</Text>
              <Text style={[s.statLbl, { color: C.textTertiary }]}>Unique</Text>
            </View>
            <View style={[s.statDivider, { backgroundColor: C.border }]} />
            <View style={s.stat}>
              <Text style={[s.statVal, { color: C.text }]}>{creditsLeft}</Text>
              <Text style={[s.statLbl, { color: C.textTertiary }]}>Credits</Text>
            </View>
          </View>

          {/* Cap warning */}
          {uniqueClaims > MAX_CLAIMS && (
            <View style={[s.warningBox, { backgroundColor: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.2)' }]}>
              <AlertTriangle size={14} color="#F59E0B" strokeWidth={2} />
              <Text style={s.warningText}>
                Capped at {MAX_CLAIMS} claims per request. Upgrade for higher limits.
              </Text>
            </View>
          )}

          {/* Grouped savings note */}
          {groupedClaims > 0 && (
            <View style={[s.savingBox, { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.15)' }]}>
              <Layers size={13} color="#10B981" strokeWidth={2} />
              <Text style={s.savingText}>
                {groupedClaims} similar claims auto-grouped — you saved {groupedClaims} credit{groupedClaims !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Options */}
          <View style={s.options}>
            {options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  s.optionBtn,
                  { borderColor: opt.highlight ? '#0284C7' : C.border, backgroundColor: opt.highlight ? 'rgba(2,132,199,0.08)' : C.surface },
                  opt.disabled && { opacity: 0.4 },
                ]}
                onPress={opt.disabled ? undefined : opt.onPress}
                activeOpacity={opt.disabled ? 1 : 0.75}
              >
                <View style={s.optionLeft}>
                  <Text style={[s.optionLabel, { color: opt.highlight ? '#0284C7' : C.text }]}>{opt.label}</Text>
                  <Text style={[s.optionSub, { color: C.textSecondary }]}>{opt.sub}</Text>
                </View>
                <View style={s.optionRight}>
                  <View style={[s.creditBadge, { backgroundColor: opt.highlight ? 'rgba(2,132,199,0.15)' : C.border }]}>
                    <Zap size={11} color={opt.highlight ? '#0284C7' : C.textSecondary} strokeWidth={2} />
                    <Text style={[s.creditBadgeText, { color: opt.highlight ? '#0284C7' : C.textSecondary }]}>
                      {opt.cost} cr
                    </Text>
                  </View>
                  {!opt.disabled && <ChevronRight size={15} color={opt.highlight ? '#0284C7' : C.textTertiary} strokeWidth={2.5} />}
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Out of credits */}
          {!canAffordAll && (
            <TouchableOpacity
              style={s.upgradeBtn}
              onPress={onUpgrade}
              activeOpacity={0.85}
            >
              <Zap size={15} color="#fff" strokeWidth={2} />
              <Text style={s.upgradeBtnText}>Get more credits</Text>
              <ChevronRight size={15} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          <Text style={[s.footer, { color: C.textTertiary }]}>
            Credits deducted only after verification completes
          </Text>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, paddingBottom: 36 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 2 },
  headerTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  headerSub: { fontSize: 13, fontWeight: '400' },
  closeBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 14 },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statWithIcon: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, fontWeight: '500' },
  statDivider: { width: 1, marginHorizontal: 4 },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  warningText: { flex: 1, fontSize: 12, color: '#F59E0B', fontWeight: '500', lineHeight: 17 },
  savingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1 },
  savingText: { flex: 1, fontSize: 12, color: '#10B981', fontWeight: '500' },
  options: { gap: 10 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderRadius: 16, borderWidth: 1.5 },
  optionLeft: { gap: 3 },
  optionLabel: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  optionSub: { fontSize: 12, fontWeight: '400' },
  optionRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  creditBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  creditBadgeText: { fontSize: 12, fontWeight: '700' },
  upgradeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 14, backgroundColor: '#0284C7', marginTop: 4 },
  upgradeBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  footer: { fontSize: 11, textAlign: 'center', marginTop: 4 },
});
