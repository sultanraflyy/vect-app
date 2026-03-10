import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Dimensions, Animated, useColorScheme, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shield, Search, FileCheck, ChevronRight, Zap } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const ONBOARDING_KEY = 'vect_onboarding_done';

const setOnboardingDone = async () => {
  if (Platform.OS === 'web') {
    localStorage.setItem(ONBOARDING_KEY, 'true');
  } else {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  }
};

const slides = [
  {
    icon: Shield,
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    title: 'Truth\nInfrastructure',
    subtitle: 'Stop sharing misinformation. Vect verifies every claim before you act on it.',
  },
  {
    icon: Search,
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    title: 'Three AI\nAgents at Work',
    subtitle: 'Extract claims → Search sources → Audit accuracy. All in seconds, not hours.',
  },
  {
    icon: FileCheck,
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    title: 'Full Audit\nTrail',
    subtitle: 'Every verdict comes with clickable sources. No black box — full transparency.',
  },
  {
    icon: Zap,
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    title: 'Start\nVerifying',
    subtitle: 'Get 5 free verifications. Text, URL, or PDF — paste anything and get your Trust Score.',
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() ?? 'light';
  const C = Colors[scheme];
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isLast = current === slides.length - 1;
  const slide = slides[current];
  const Icon = slide.icon;

  const animateToSlide = (next: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleNext = async () => {
    if (isLast) {
      await setOnboardingDone();
      router.replace('/(tabs)');
    } else {
      animateToSlide(current + 1);
    }
  };

  const handleSkip = async () => {
    await setOnboardingDone();
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.screen, { backgroundColor: C.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Skip button */}
      {!isLast && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: C.textSecondary }]}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      <Animated.View style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
      ]}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: slide.accentLight }]}>
          <Icon size={48} color={slide.accent} strokeWidth={1.5} />
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: C.text }]}>{slide.title}</Text>
          <Text style={[styles.subtitle, { color: C.textSecondary }]}>{slide.subtitle}</Text>
        </View>
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => animateToSlide(i)}>
              <View style={[
                styles.dot,
                {
                  backgroundColor: i === current ? slide.accent : C.border,
                  width: i === current ? 24 : 8,
                }
              ]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: slide.accent }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>
            {isLast ? 'Get Started' : 'Continue'}
          </Text>
          <ChevronRight size={18} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        {isLast && (
          <Text style={[styles.freeNote, { color: C.textTertiary }]}>
            5 free verifications • No credit card required
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },

  skipBtn: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  skipText: { fontSize: 14, fontWeight: '500' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 36,
  },

  iconContainer: {
    width: 112,
    height: 112,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: { alignItems: 'center', gap: 14 },
  title: {
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.5,
    textAlign: 'center',
    lineHeight: 44,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 25,
    textAlign: 'center',
    fontWeight: '400',
    maxWidth: 280,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 20,
    alignItems: 'center',
  },

  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  btn: {
    width: '100%',
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  freeNote: {
    fontSize: 13,
    fontWeight: '500',
  },
});
