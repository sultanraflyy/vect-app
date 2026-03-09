import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Easing } from 'react-native';
import { useFonts, BarlowCondensed_600SemiBold_Italic } from '@expo-google-fonts/barlow-condensed';

export default function SplashScreen() {
  const [fontsLoaded] = useFonts({ BarlowCondensed_600SemiBold_Italic });

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const shieldOpacity = useRef(new Animated.Value(0)).current;
  const shieldScale = useRef(new Animated.Value(0.6)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current) return;
    animated.current = true;
    animate();
  }, []);

  const animate = () => {
    const ringAnim = (anim: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]);

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(shieldScale, { toValue: 1, friction: 6, tension: 50, useNativeDriver: true }),
        Animated.timing(shieldOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]).start();
    }, 300);

    Animated.stagger(200, [ringAnim(ring1, 600), ringAnim(ring2, 600), ringAnim(ring3, 600)]).start();

    setTimeout(() => {
      Animated.parallel([
        Animated.spring(checkScale, { toValue: 1, friction: 4, tension: 100, useNativeDriver: true }),
        Animated.timing(checkOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }, 1000);

    setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }, 1200);

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    }, 1600);

    const pulseDot = (dot: Animated.Value, delay: number) => {
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
      ])).start();
    };
    setTimeout(() => {
      pulseDot(dot1, 0); pulseDot(dot2, 150); pulseDot(dot3, 300);
    }, 1800);

    setTimeout(() => {
      Animated.timing(screenOpacity, {
        toValue: 0, duration: 500,
        easing: Easing.in(Easing.cubic), useNativeDriver: true,
      }).start();
    }, 2600);
  };

  const ringStyle = (anim: Animated.Value, size: number) => ({
    position: 'absolute' as const,
    width: size, height: size, borderRadius: size / 2,
    borderWidth: 1, borderColor: '#0284C7',
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
  });

  return (
    <Animated.View style={[styles.screen, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1628" />
      <Animated.View style={ringStyle(ring1, 500)} />
      <Animated.View style={ringStyle(ring2, 380)} />
      <Animated.View style={ringStyle(ring3, 260)} />
      <Animated.View style={[styles.iconWrap, { opacity: shieldOpacity, transform: [{ scale: shieldScale }] }]}>
        <View style={styles.shieldOuter}>
          <Animated.View style={[styles.checkWrap, { opacity: checkOpacity, transform: [{ scale: checkScale }] }]}>
            <View style={styles.checkLine1} />
            <View style={styles.checkLine2} />
          </Animated.View>
        </View>
      </Animated.View>
      <Animated.Text style={[
        styles.title,
        { opacity: titleOpacity, transform: [{ translateY: titleY }] },
        fontsLoaded && { fontFamily: 'BarlowCondensed_600SemiBold_Italic' }
      ]}>
        VECT
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        TRUTH INFRASTRUCTURE
      </Animated.Text>
      <View style={styles.dots}>
        {[dot1, dot2, dot3].map((dot, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center', gap: 20 },
  iconWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  shieldOuter: {
    width: 100, height: 114, backgroundColor: 'rgba(2,132,199,0.12)',
    borderRadius: 20, borderBottomLeftRadius: 50, borderBottomRightRadius: 50,
    borderWidth: 2, borderColor: '#0284C7', alignItems: 'center', justifyContent: 'center',
  },
  checkWrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  checkLine1: {
    position: 'absolute', width: 14, height: 3, backgroundColor: '#fff', borderRadius: 2,
    bottom: 12, left: 6, transform: [{ rotate: '45deg' }, { translateX: 2 }],
  },
  checkLine2: {
    position: 'absolute', width: 26, height: 3, backgroundColor: '#fff', borderRadius: 2,
    bottom: 16, right: 2, transform: [{ rotate: '-50deg' }, { translateX: -2 }],
  },
  title: { fontSize: 56, fontWeight: '600', color: '#fff', letterSpacing: 10, fontStyle: 'italic' },
  tagline: { fontSize: 11, fontWeight: '500', color: '#38BDF8', letterSpacing: 5 },
  dots: { position: 'absolute', bottom: 80, flexDirection: 'row', gap: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#0284C7' },
});
