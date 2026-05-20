import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { Colors, Typography } from '../theme/theme';

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  // ── Logo ──
  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // ── Ring pulsant ──
  const ringScale = useRef(new Animated.Value(1)).current;
  const ringOpacity = useRef(new Animated.Value(0.15)).current;

  // ── Titre ──
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslateY = useRef(new Animated.Value(16)).current;

  // ── Tagline ──
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(16)).current;

  // ── Dots (width = layout prop → useNativeDriver: false) ──
  const dot1Opacity = useRef(new Animated.Value(0)).current;
  const dot1Width = useRef(new Animated.Value(6)).current;
  const dot2Opacity = useRef(new Animated.Value(0)).current;
  const dot2Width = useRef(new Animated.Value(6)).current;
  const dot3Opacity = useRef(new Animated.Value(0)).current;
  const dot3Width = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    // ── Ring pulse — loop infini ──
    const startRing = () => {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(ringScale, {
              toValue: 1.25,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(ringScale, {
              toValue: 1,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(ringOpacity, {
              toValue: 0,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
            Animated.timing(ringOpacity, {
              toValue: 0.15,
              duration: 1000,
              easing: Easing.ease,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    };

    // ── Phase 1 : 300ms — logo + dot 1 ──
    const t1 = setTimeout(() => {
      startRing();
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          damping: 15,
          stiffness: 150,
          mass: 1,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot1Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(dot1Width, {
          toValue: 18,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, 300);

    // ── Phase 2 : 800ms — titre + dot 2 ──
    const t2 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dot2Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(dot2Width, {
          toValue: 18,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, 800);

    // ── Phase 3 : 1300ms — tagline + dot 3 ──
    const t3 = setTimeout(() => {
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(dot3Opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(dot3Width, {
          toValue: 18,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();
    }, 1300);

    // ── Phase 4 : 2600ms — fin du splash ──
    const t4 = setTimeout(onDone, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Décors d'arrière-plan ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.circleOrange} />
        <View style={styles.circleTeal} />
      </View>

      {/* ── Éléments centraux ── */}
      <View style={styles.center}>

        {/* Logo + ring */}
        <Animated.View
          style={[
            styles.logoOuter,
            { opacity: logoOpacity, transform: [{ scale: logoScale }] },
          ]}
        >
          {/* Ring pulsant */}
          <Animated.View
            style={[
              styles.ring,
              { transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          />
          {/* Ombre orange via wrapper View (Android compatible) */}
          <View style={styles.logoShadow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="cover"
            />
          </View>
        </Animated.View>

        {/* Titre */}
        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
            },
          ]}
        >
          Rentify
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          Loue. Partage. Économise.
        </Animated.Text>
      </View>

      {/* ── Dots de progression ── */}
      <View style={styles.dotsContainer}>
        <Animated.View
          style={[
            styles.dotBase,
            {
              width: dot1Width,
              opacity: dot1Opacity,
              backgroundColor: Colors.primary,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dotBase,
            {
              width: dot2Width,
              opacity: dot2Opacity,
              backgroundColor: Colors.primary,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.dotBase,
            {
              width: dot3Width,
              opacity: dot3Opacity,
              backgroundColor: Colors.primary,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Décors ──
  circleOrange: {
    position: 'absolute',
    top: -80,
    left: -80,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(232, 93, 38, 0.07)',
  },
  circleTeal: {
    position: 'absolute',
    bottom: -60,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(26, 158, 117, 0.07)',
  },

  // ── Centre ──
  center: {
    alignItems: 'center',
    gap: 20,
  },

  // ── Logo ──
  logoOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    // logo 90x90 + inset -14 de chaque côté → 90 + 28 = 118
    width: 118,
    height: 118,
    borderRadius: 59,
    backgroundColor: 'rgba(232, 93, 38, 0.12)',
  },
  logoShadow: {
    borderRadius: 22,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 22,
  },

  // ── Textes ──
  title: {
    fontFamily: Typography.fontDisplay,
    fontSize: Typography.size['4xl'],
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: Typography.fontBody,
    fontSize: 15,
    color: Colors.textSecondary,
    letterSpacing: 0.3,
    textAlign: 'center',
  },

  // ── Dots ──
  dotsContainer: {
    position: 'absolute',
    bottom: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotBase: {
    height: 6,
    borderRadius: 3,
  },
});
