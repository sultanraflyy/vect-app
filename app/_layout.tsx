import { useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { CreditsProvider } from '@/providers/CreditsProvider';
import { ReportsProvider } from '@/providers/ReportsProvider';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'vect_onboarding_done';

export default function RootLayout() {
  const router = useRouter();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    // Wait for splash animation to finish (2600ms anim + 500ms fade = 3100ms)
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.replace('/login');
          return;
        }
        const done = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (done !== 'true') {
          router.replace('/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      } catch {
        router.replace('/login');
      }
    }, 3100);
  }, []);

  return (
    <CreditsProvider>
      <ReportsProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="login" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="report" options={{ presentation: 'card', animation: 'slide_from_right' }} />
          <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </ReportsProvider>
    </CreditsProvider>
  );
}
