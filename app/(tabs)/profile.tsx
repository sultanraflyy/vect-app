import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  useColorScheme, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User, Shield, Zap, ChevronRight,
  LogOut, Star, FileCheck, Lock, Bell, HelpCircle,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';
import { useCredits } from '@/providers/CreditsProvider';
import { useReports } from '@/providers/ReportsProvider';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const router = useRouter();
  const { creditsLeft, creditsUsed } = useCredits();
  const { reports } = useReports();
  const [loggingOut, setLoggingOut] = useState(false);
  const [user, setUser] = useState<any>(null);

  useState(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  });

  const completedReports = reports.filter(r => r.status === 'completed').length;
  const totalClaims = reports.reduce((acc, r) => acc + (r.claims?.length || 0), 0);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          await supabase.auth.signOut();
          router.replace('/login');
        },
      },
    ]);
  };

  const emailInitial = user?.email?.[0]?.toUpperCase() ?? '?';
  const email = user?.email ?? '';

  return (
    <View style={[styles.screen, { backgroundColor: C.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: C.text }]}>Profile</Text>

        {/* Avatar card */}
        <View style={[styles.avatarCard, { backgroundColor: C.card }]}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
            <Text style={styles.avatarLetter}>{emailInitial}</Text>
          </View>
          <View style={styles.avatarInfo}>
            <Text style={[styles.avatarEmail, { color: C.text }]} numberOfLines={1}>{email}</Text>
            <View style={[styles.planBadge, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
              <Zap size={11} color="#0284C7" strokeWidth={2.5} />
              <Text style={styles.planText}>Free Plan</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Reports', value: completedReports },
            { label: 'Claims', value: totalClaims },
            { label: 'Credits Left', value: creditsLeft },
          ].map((s, i) => (
            <View key={i} style={[styles.statBox, { backgroundColor: C.card }]}>
              <Text style={[styles.statValue, { color: C.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: C.textSecondary }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade card — now goes to paywall */}
        <TouchableOpacity
          style={styles.upgradeCard}
          activeOpacity={0.88}
          onPress={() => router.push('/paywall')}
        >
          <View style={styles.upgradeLeft}>
            <View style={styles.upgradeIconWrap}>
              <Star size={20} color="#fff" strokeWidth={2} />
            </View>
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
              <Text style={styles.upgradeSub}>1,500 verifications/month · $14.99</Text>
            </View>
          </View>
          <ChevronRight size={18} color="rgba(255,255,255,0.7)" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Credits bar */}
        <View style={[styles.creditsCard, { backgroundColor: C.card }]}>
          <View style={styles.creditsHeader}>
            <View style={styles.creditsLeft}>
              <Shield size={15} color="#0284C7" strokeWidth={2} />
              <Text style={[styles.creditsTitle, { color: C.text }]}>Free Credits</Text>
            </View>
            <Text style={[styles.creditsCount, { color: C.textSecondary }]}>{creditsLeft} left</Text>
          </View>
          <View style={[styles.progressBg, { backgroundColor: C.border }]}>
            <View style={[styles.progressFill, { width: `${Math.min((creditsLeft / 150) * 100, 100)}%` }]} />
          </View>
          <Text style={[styles.creditsHint, { color: C.textTertiary }]}>
            150 standard credits/month on Free plan
          </Text>
        </View>

        {/* Settings */}
        <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Settings</Text>
        <View style={[styles.menuCard, { backgroundColor: C.card }]}>
          {[
            { icon: Bell, label: 'Notifications', onPress: () => Alert.alert('Coming Soon') },
            { icon: Lock, label: 'Privacy & Security', onPress: () => Alert.alert('Coming Soon') },
            { icon: FileCheck, label: 'My Reports', onPress: () => router.push('/(tabs)') },
            { icon: HelpCircle, label: 'Help & Support', onPress: () => Alert.alert('Coming Soon') },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={i}
              style={[styles.menuItem, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border }]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: C.surface }]}>
                <item.icon size={16} color={C.textSecondary} strokeWidth={2} />
              </View>
              <Text style={[styles.menuLabel, { color: C.text }]}>{item.label}</Text>
              <ChevronRight size={15} color={C.textTertiary} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: C.card }]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.8}
        >
          {loggingOut
            ? <ActivityIndicator size="small" color="#EF4444" />
            : <><LogOut size={17} color="#EF4444" strokeWidth={2} /><Text style={styles.logoutText}>Log Out</Text></>
          }
        </TouchableOpacity>

        <Text style={[styles.version, { color: C.textTertiary }]}>Vect v1.0.0 · Truth Infrastructure</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  pageTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  avatarCard: { borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  avatar: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 24, fontWeight: '700', color: '#0284C7' },
  avatarInfo: { flex: 1, gap: 6 },
  avatarEmail: { fontSize: 15, fontWeight: '600' },
  planBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  planText: { fontSize: 11, fontWeight: '600', color: '#0284C7' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  upgradeCard: { borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0284C7', shadowColor: '#0284C7', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
  upgradeLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upgradeIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  upgradeText: { gap: 2 },
  upgradeTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  upgradeSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  creditsCard: { borderRadius: 20, padding: 16, gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  creditsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  creditsLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  creditsTitle: { fontSize: 14, fontWeight: '600' },
  creditsCount: { fontSize: 13, fontWeight: '500' },
  progressBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#0284C7' },
  creditsHint: { fontSize: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginTop: 4 },
  menuCard: { borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: { borderRadius: 16, height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { fontSize: 12, textAlign: 'center', paddingVertical: 4 },
});
