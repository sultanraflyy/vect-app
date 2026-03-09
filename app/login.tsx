import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, useColorScheme, Alert, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace('/(tabs)');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        Alert.alert(
          'Check your email',
          'We sent a confirmation link. Please verify your email then log in.',
          [{ text: 'OK', onPress: () => setMode('login') }]
        );
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: C.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo area */}
        <View style={styles.logoArea}>
          <View style={[styles.shieldWrap, { backgroundColor: 'rgba(2,132,199,0.1)', borderColor: '#0284C7' }]}>
            <View style={styles.checkLine1} />
            <View style={styles.checkLine2} />
          </View>
          <Text style={[styles.logoText, { color: C.text }]}>VECT</Text>
          <Text style={[styles.logoSub, { color: C.textSecondary }]}>Truth Infrastructure</Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: C.card }]}>
          {/* Mode toggle */}
          <View style={[styles.toggle, { backgroundColor: C.surface }]}>
            {(['login', 'signup'] as const).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.toggleBtn, mode === m && { backgroundColor: C.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.toggleText, { color: mode === m ? C.text : C.textSecondary }]}>
                  {m === 'login' ? 'Log In' : 'Sign Up'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Email */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Mail size={16} color={C.textTertiary} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="you@example.com"
                placeholderTextColor={C.textTertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldWrap}>
            <Text style={[styles.label, { color: C.textSecondary }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Lock size={16} color={C.textTertiary} strokeWidth={2} />
              <TextInput
                style={[styles.input, { color: C.text }]}
                placeholder="••••••••"
                placeholderTextColor={C.textTertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={mode === 'login' ? 'password' : 'new-password'}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <EyeOff size={16} color={C.textTertiary} strokeWidth={2} />
                  : <Eye size={16} color={C.textTertiary} strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: C.tint, opacity: loading ? 0.7 : 1 }]}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Text style={styles.btnText}>
                    {mode === 'login' ? 'Log In' : 'Create Account'}
                  </Text>
                  <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
                </>
            }
          </TouchableOpacity>

          {mode === 'login' && (
            <TouchableOpacity onPress={() => Alert.alert('Reset Password', 'Enter your email above and we\'ll send a reset link.', [{ text: 'OK' }])}>
              <Text style={[styles.forgotText, { color: C.tint }]}>Forgot password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <Text style={[styles.securityText, { color: C.textTertiary }]}>
            🔒 Your data is encrypted and never shared. Reports are private to your account only.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 24, gap: 24 },

  logoArea: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  shieldWrap: {
    width: 64, height: 72,
    borderRadius: 14, borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  checkLine1: {
    position: 'absolute', width: 10, height: 2.5,
    backgroundColor: '#0284C7', borderRadius: 2,
    bottom: 22, left: 14,
    transform: [{ rotate: '45deg' }],
  },
  checkLine2: {
    position: 'absolute', width: 18, height: 2.5,
    backgroundColor: '#0284C7', borderRadius: 2,
    bottom: 26, right: 10,
    transform: [{ rotate: '-50deg' }],
  },
  logoText: { fontSize: 32, fontWeight: '800', letterSpacing: 6 },
  logoSub: { fontSize: 13, fontWeight: '500', letterSpacing: 2 },

  card: {
    borderRadius: 24, padding: 20, gap: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 4,
  },

  toggle: {
    flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
  },
  toggleText: { fontSize: 14, fontWeight: '600' },

  fieldWrap: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, fontWeight: '400' },

  btn: {
    height: 54, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#0284C7', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    marginTop: 4,
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },
  forgotText: { fontSize: 13, fontWeight: '500', textAlign: 'center' },

  securityNote: { alignItems: 'center', paddingHorizontal: 8 },
  securityText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
