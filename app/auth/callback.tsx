import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'vect_onboarding_done';

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        const done = Platform.OS === 'web'
          ? localStorage.getItem(ONBOARDING_KEY)
          : await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done !== 'true') {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Auth callback error:', err);
        router.replace('/login');
      }
    };

    handleCallback();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0284C7" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
