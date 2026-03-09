import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Linking, StatusBar, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X, Shield, Zap, Building2, ChevronRight, Check, Minus,
  Sparkles, Lock, RotateCcw, TrendingDown,
} from 'lucide-react-native';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAVY = '#0A1628';
const NAVY2 = '#0F1F3D';
const BLUE = '#0284C7';
const BLUE_LIGHT = 'rgba(2,132,199,0.12)';
const BLUE_GLOW = 'rgba(2,132,199,0.06)';
const GOLD = '#F59E0B';
const GOLD_LIGHT = 'rgba(245,158,11,0.12)';
const SUCCESS = '#10B981';
const SUCCESS_LIGHT = 'rgba(16,185,129,0.1)';
const TEXT = '#F1F5F9';
const TEXT2 = '#94A3B8';
const TEXT3 = '#475569';
const BORDER = 'rgba(255,255,255,0.07)';
const CARD = 'rgba(255,255,255,0.04)';

const LEMONSQUEEZY_PRO = 'https://vect.lemonsqueezy.com/checkout/pro';
const LEMONSQUEEZY_BUSINESS = 'https://vect.lemonsqueezy.com/checkout/business';
const LEMONSQUEEZY_TOPUP = {
  standard_starter: 'https://vect.lemonsqueezy.com/checkout/standard-500',
  standard_standard: 'https://vect.lemonsqueezy.com/checkout/standard-1500',
  standard_bulk: 'https://vect.lemonsqueezy.com/checkout/standard-4000',
  deep_starter: 'https://vect.lemonsqueezy.com/checkout/deep-50',
  deep_standard: 'https://vect.lemonsqueezy.com/checkout/deep-200',
};

type Plan = 'free' | 'pro' | 'business';
type TopUpType = 'standard' | 'deep';

// ─── Data ─────────────────────────────────────────────────────────────────────

const PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    period: '/month',
    tagline: 'Try Vect out',
    color: TEXT2,
    credits: '150 standard credits/mo',
    features: [
      { label: '150 standard verifications/mo', ok: true },
      { label: 'Standard web search', ok: true },
      { label: 'Claim auto-grouping', ok: true },
      { label: '1 seat', ok: true },
      { label: 'Deep research', ok: false },
      { label: 'PDF/CSV export', ok: false },
      { label: 'Analytics', ok: false },
      { label: 'API access', ok: false },
    ],
  },
  pro: {
    name: 'Pro',
    price: '$14.99',
    period: '/month',
    tagline: 'For journalists & researchers',
    color: BLUE,
    badge: 'MOST POPULAR',
    credits: '1,500 standard + 150 deep/mo',
    savingNote: '60% cheaper per credit vs top-up',
    features: [
      { label: '1,500 standard verifications/mo', ok: true },
      { label: '150 deep research credits/mo', ok: true },
      { label: 'Claim auto-grouping', ok: true },
      { label: 'Basic analytics', ok: true },
      { label: 'PDF/CSV export', ok: true },
      { label: '1 seat', ok: true },
      { label: 'API access', ok: false },
      { label: 'Priority support', ok: false },
    ],
    url: LEMONSQUEEZY_PRO,
  },
  business: {
    name: 'Business',
    price: '$149',
    period: '/month',
    tagline: 'For teams & enterprises',
    color: GOLD,
    badge: 'BEST VALUE',
    credits: '15,000 standard + 1,500 deep/mo',
    savingNote: '13× cheaper deep research vs top-up',
    features: [
      { label: '15,000 standard verifications/mo', ok: true },
      { label: '1,500 deep research credits/mo', ok: true },
      { label: 'Claim auto-grouping', ok: true },
      { label: 'Full analytics dashboard', ok: true },
      { label: 'PDF/CSV export', ok: true },
      { label: '5 seats', ok: true },
      { label: 'API access', ok: true },
      { label: 'Priority support', ok: true },
    ],
    url: LEMONSQUEEZY_BUSINESS,
  },
};

const TOPUPS = {
  standard: [
    { name: 'Starter', credits: '500', price: '$4.99', perCredit: '$0.0100', key: 'standard_starter' },
    { name: 'Standard', credits: '1,500', price: '$12.99', perCredit: '$0.0087', key: 'standard_standard' },
    { name: 'Bulk', credits: '4,000', price: '$29.99', perCredit: '$0.0075', key: 'standard_bulk' },
  ],
  deep: [
    { name: 'Starter Deep', credits: '50', price: '$4.99', perCredit: '$0.0998', key: 'deep_starter' },
    { name: 'Standard Deep', credits: '200', price: '$16.99', perCredit: '$0.0849', key: 'deep_standard' },
  ],
};

// ─── Components ───────────────────────────────────────────────────────────────

const FeatureRow = ({ label, ok }: { label: string; ok: boolean }) => (
  <View style={fr.row}>
    <View style={[fr.icon, { backgroundColor: ok ? SUCCESS_LIGHT : 'rgba(255,255,255,0.04)' }]}>
      {ok
        ? <Check size={11} color={SUCCESS} strokeWidth={3} />
        : <Minus size={11} color={TEXT3} strokeWidth={2.5} />}
    </View>
    <Text style={[fr.label, { color: ok ? TEXT : TEXT3 }]}>{label}</Text>
  </View>
);

const fr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  icon: { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 13.5, fontWeight: '400', flex: 1, lineHeight: 18 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activePlan, setActivePlan] = useState<Plan>('pro');
  const [topUpType, setTopUpType] = useState<TopUpType>('standard');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const plan = PLANS[activePlan];

  const handleUpgrade = () => {
    const url = activePlan === 'pro' ? LEMONSQUEEZY_PRO : activePlan === 'business' ? LEMONSQUEEZY_BUSINESS : null;
    if (!url) return;
    Linking.openURL(url);
  };

  const handleTopUp = (key: string) => {
    const url = LEMONSQUEEZY_TOPUP[key as keyof typeof LEMONSQUEEZY_TOPUP];
    if (url) Linking.openURL(url);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Close button */}
      <TouchableOpacity style={[s.closeBtn, { top: insets.top + 12 }]} onPress={() => router.back()} activeOpacity={0.7}>
        <X size={18} color={TEXT2} strokeWidth={2} />
      </TouchableOpacity>

      <Animated.ScrollView
        style={{ opacity: fadeAnim }}
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <Animated.View style={[s.hero, { transform: [{ translateY: slideAnim }] }]}>
          <View style={s.glow} />
          <View style={s.shieldWrap}>
            <Shield size={32} color={BLUE} strokeWidth={1.8} fill={BLUE_LIGHT} />
          </View>
          <View style={s.upgradeBadge}>
            <Sparkles size={11} color={BLUE} strokeWidth={2} />
            <Text style={s.upgradeBadgeText}>UPGRADE VECT</Text>
          </View>
          <Text style={s.heroTitle}>Pay for what you{'\n'}actually verify.</Text>
          <Text style={s.heroSub}>One credit = one claim checked.{'\n'}No flat fees. No wasted spend.</Text>
        </Animated.View>

        {/* ── Plan Tabs ── */}
        <View style={s.planTabs}>
          {(['free', 'pro', 'business'] as Plan[]).map((p) => {
            const active = activePlan === p;
            const color = PLANS[p].color;
            return (
              <TouchableOpacity
                key={p}
                style={[s.planTab, active && { backgroundColor: BLUE_LIGHT, borderColor: BLUE }]}
                onPress={() => setActivePlan(p)}
                activeOpacity={0.7}
              >
                <Text style={[s.planTabText, { color: active ? BLUE : TEXT2 }]}>
                  {PLANS[p].name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Plan Card ── */}
        <View style={[s.planCard, activePlan === 'business' && { borderColor: GOLD + '44' }]}>
          {/* Badge */}
          {'badge' in plan && (
            <View style={[s.planBadge, { backgroundColor: activePlan === 'business' ? GOLD_LIGHT : BLUE_LIGHT }]}>
              <Text style={[s.planBadgeText, { color: activePlan === 'business' ? GOLD : BLUE }]}>
                {(plan as any).badge}
              </Text>
            </View>
          )}

          {/* Price */}
          <View style={s.priceRow}>
            <Text style={s.price}>{plan.price}</Text>
            <Text style={s.pricePeriod}>{plan.period}</Text>
          </View>
          <Text style={s.planTagline}>{plan.tagline}</Text>

          {/* Credits highlight */}
          <View style={s.creditsBox}>
            <Zap size={14} color={activePlan === 'business' ? GOLD : BLUE} strokeWidth={2} />
            <Text style={[s.creditsText, { color: activePlan === 'business' ? GOLD : BLUE }]}>
              {plan.credits}
            </Text>
          </View>

          {/* Saving note */}
          {'savingNote' in plan && (
            <View style={s.savingRow}>
              <TrendingDown size={13} color={SUCCESS} strokeWidth={2} />
              <Text style={s.savingText}>{(plan as any).savingNote}</Text>
            </View>
          )}

          {/* Features */}
          <View style={s.featuresList}>
            {plan.features.map((f, i) => <FeatureRow key={i} label={f.label} ok={f.ok} />)}
          </View>

          {/* CTA */}
          {activePlan !== 'free' && (
            <TouchableOpacity
              style={[s.ctaBtn, { backgroundColor: activePlan === 'business' ? GOLD : BLUE }]}
              onPress={handleUpgrade}
              activeOpacity={0.85}
            >
              <Text style={s.ctaBtnText}>
                Upgrade to {plan.name} — {plan.price}/mo
              </Text>
              <ChevronRight size={17} color="rgba(255,255,255,0.8)" strokeWidth={2.5} />
            </TouchableOpacity>
          )}

          {activePlan === 'business' && (
            <TouchableOpacity style={s.enterpriseLink} onPress={() => Linking.openURL('mailto:hello@vect.app')} activeOpacity={0.7}>
              <Building2 size={14} color={TEXT2} strokeWidth={2} />
              <Text style={s.enterpriseLinkText}>Need Enterprise? Contact us →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Top-Up Section ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Top-Up Credits</Text>
            <Text style={s.sectionSub}>One-time · No expiry</Text>
          </View>

          {/* Toggle */}
          <View style={s.topUpToggle}>
            {(['standard', 'deep'] as TopUpType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[s.topUpTab, topUpType === t && { backgroundColor: BLUE_LIGHT, borderColor: BLUE }]}
                onPress={() => setTopUpType(t)}
                activeOpacity={0.7}
              >
                <Text style={[s.topUpTabText, { color: topUpType === t ? BLUE : TEXT2 }]}>
                  {t === 'standard' ? 'Standard' : '⚡ Deep Research'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {topUpType === 'deep' && (
            <View style={s.deepWarning}>
              <Text style={s.deepWarningText}>⚡ Deep Research uses 8–13× more compute per claim. Designed for legal, medical & compliance.</Text>
            </View>
          )}

          {TOPUPS[topUpType].map((bundle) => (
            <TouchableOpacity
              key={bundle.key}
              style={s.topUpCard}
              onPress={() => handleTopUp(bundle.key)}
              activeOpacity={0.75}
            >
              <View style={s.topUpLeft}>
                <Text style={s.topUpName}>{bundle.name}</Text>
                <Text style={s.topUpCredits}>{bundle.credits} credits</Text>
                <Text style={s.topUpPer}>{bundle.perCredit}/credit</Text>
              </View>
              <View style={s.topUpRight}>
                <Text style={s.topUpPrice}>{bundle.price}</Text>
                <View style={[s.topUpBtn, { backgroundColor: BLUE_LIGHT }]}>
                  <Text style={[s.topUpBtnText, { color: BLUE }]}>Buy</Text>
                  <ChevronRight size={13} color={BLUE} strokeWidth={2.5} />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          {topUpType === 'standard' && (
            <View style={s.hintBox}>
              <Text style={s.hintText}>💡 3× Standard top-up = $14.97 for 1,500 credits — same price as Pro, but Pro also includes 150 deep research credits. Pro wins.</Text>
            </View>
          )}
        </View>

        {/* ── Footer ── */}
        <View style={s.footer}>
          <View style={s.footerRow}>
            <Lock size={13} color={TEXT3} strokeWidth={2} />
            <Text style={s.footerText}>Secure payment via LemonSqueezy</Text>
          </View>
          <Text style={s.footerMeta}>Cancel anytime · 7-day money-back guarantee · No hidden fees</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://vect.app/restore')} activeOpacity={0.7}>
            <View style={s.restoreRow}>
              <RotateCcw size={12} color={TEXT3} strokeWidth={2} />
              <Text style={s.restoreText}>Restore purchase</Text>
            </View>
          </TouchableOpacity>
        </View>

      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: NAVY },
  scroll: { paddingHorizontal: 20, gap: 20 },

  closeBtn: {
    position: 'absolute', right: 18, zIndex: 99,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Hero
  hero: { alignItems: 'center', paddingTop: 60, paddingBottom: 8, gap: 12 },
  glow: {
    position: 'absolute', top: 20, width: 280, height: 280, borderRadius: 140,
    backgroundColor: BLUE_GLOW,
  },
  shieldWrap: {
    width: 72, height: 72, borderRadius: 22,
    backgroundColor: BLUE_LIGHT,
    borderWidth: 1, borderColor: BLUE + '44',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  upgradeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 5,
    backgroundColor: BLUE_LIGHT, borderRadius: 100,
    borderWidth: 1, borderColor: BLUE + '33',
  },
  upgradeBadgeText: { fontSize: 10, fontWeight: '700', color: BLUE, letterSpacing: 1.5 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: TEXT, textAlign: 'center', letterSpacing: -0.8, lineHeight: 38 },
  heroSub: { fontSize: 14, color: TEXT2, textAlign: 'center', lineHeight: 21, fontWeight: '400' },

  // Plan tabs
  planTabs: { flexDirection: 'row', gap: 8 },
  planTab: {
    flex: 1, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', backgroundColor: CARD,
  },
  planTabText: { fontSize: 13, fontWeight: '700', letterSpacing: -0.1 },

  // Plan card
  planCard: {
    backgroundColor: CARD, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER,
    padding: 20, gap: 14,
  },
  planBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  planBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  price: { fontSize: 44, fontWeight: '800', color: TEXT, letterSpacing: -2 },
  pricePeriod: { fontSize: 15, color: TEXT2, fontWeight: '500', marginBottom: 8 },
  planTagline: { fontSize: 13, color: TEXT2, fontWeight: '400', marginTop: -8 },
  creditsBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: BLUE_LIGHT, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9,
  },
  creditsText: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2, flex: 1 },
  savingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: SUCCESS_LIGHT, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  savingText: { fontSize: 12, color: SUCCESS, fontWeight: '600' },
  featuresList: { gap: 2, marginTop: 4 },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 14,
    marginTop: 4,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  enterpriseLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 4,
  },
  enterpriseLinkText: { fontSize: 13, color: TEXT2, fontWeight: '500' },

  // Section
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.4 },
  sectionSub: { fontSize: 12, color: TEXT2, fontWeight: '500' },

  // Top-up
  topUpToggle: { flexDirection: 'row', gap: 8 },
  topUpTab: {
    flex: 1, paddingVertical: 9, borderRadius: 10,
    borderWidth: 1, borderColor: BORDER,
    alignItems: 'center', backgroundColor: CARD,
  },
  topUpTabText: { fontSize: 13, fontWeight: '600' },
  deepWarning: {
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 10,
    borderWidth: 1, borderColor: GOLD + '22',
    padding: 12,
  },
  deepWarningText: { fontSize: 12, color: GOLD, fontWeight: '500', lineHeight: 17 },
  topUpCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: CARD, borderRadius: 14,
    borderWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  topUpLeft: { gap: 3 },
  topUpName: { fontSize: 14, fontWeight: '700', color: TEXT },
  topUpCredits: { fontSize: 12, color: TEXT2, fontWeight: '500' },
  topUpPer: { fontSize: 11, color: TEXT3, fontWeight: '400' },
  topUpRight: { alignItems: 'flex-end', gap: 8 },
  topUpPrice: { fontSize: 18, fontWeight: '800', color: TEXT, letterSpacing: -0.5 },
  topUpBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  topUpBtnText: { fontSize: 12, fontWeight: '700' },
  hintBox: {
    backgroundColor: 'rgba(2,132,199,0.06)', borderRadius: 10,
    borderWidth: 1, borderColor: BLUE + '22', padding: 12,
  },
  hintText: { fontSize: 12, color: TEXT2, lineHeight: 18 },

  // Footer
  footer: { alignItems: 'center', gap: 8, paddingTop: 8 },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { fontSize: 12, color: TEXT3, fontWeight: '500' },
  footerMeta: { fontSize: 11, color: TEXT3, textAlign: 'center', lineHeight: 16 },
  restoreRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  restoreText: { fontSize: 12, color: TEXT3, fontWeight: '500' },
});
