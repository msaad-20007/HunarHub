import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SIZES } from '../theme/Theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const ring1Scale   = useRef(new Animated.Value(0)).current;
  const ring1Opacity = useRef(new Animated.Value(0)).current;
  const ring2Scale   = useRef(new Animated.Value(0)).current;
  const ring2Opacity = useRef(new Animated.Value(0)).current;
  const ring3Scale   = useRef(new Animated.Value(0)).current;
  const ring3Opacity = useRef(new Animated.Value(0)).current;
  const iconScale    = useRef(new Animated.Value(0)).current;
  const iconRotate   = useRef(new Animated.Value(-0.1)).current;
  const iconOpacity  = useRef(new Animated.Value(0)).current;
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(30)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const screenFade   = useRef(new Animated.Value(1)).current;

  const rotate = iconRotate.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-30deg', '30deg'],
  });

  useEffect(() => {
    Animated.sequence([
      // Rings ripple out one by one
      Animated.parallel([
        Animated.timing(ring1Scale,   { toValue: 1,   duration: 500, useNativeDriver: true }),
        Animated.timing(ring1Opacity, { toValue: 0.25, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring2Scale,   { toValue: 1,   duration: 400, useNativeDriver: true }),
        Animated.timing(ring2Opacity, { toValue: 0.15, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(ring3Scale,   { toValue: 1,   duration: 350, useNativeDriver: true }),
        Animated.timing(ring3Opacity, { toValue: 0.08, duration: 350, useNativeDriver: true }),
      ]),
      // Icon bounces in with rotation
      Animated.parallel([
        Animated.spring(iconScale,  { toValue: 1, useNativeDriver: true, tension: 100, friction: 5 }),
        Animated.timing(iconOpacity,{ toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(iconRotate, { toValue: 0, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(glowOpacity,{ toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      // App name slams in
      Animated.parallel([
        Animated.spring(textY,     { toValue: 0, useNativeDriver: true, tension: 90, friction: 7 }),
        Animated.timing(textOpacity,{ toValue: 1, duration: 300, useNativeDriver: true }),
      ]),
      // Tagline fades
      Animated.timing(tagOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Hold
      Animated.delay(800),
      // Fade out
      Animated.timing(screenFade, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenFade }]}>
      <LinearGradient
        colors={['#07070D', '#0A0A0F', '#0A0A0F']}
        style={StyleSheet.absoluteFill}
      />

      {/* Ripple rings */}
      <Animated.View style={[styles.ring, styles.ring3, { transform: [{ scale: ring3Scale }], opacity: ring3Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring2, { transform: [{ scale: ring2Scale }], opacity: ring2Opacity }]} />
      <Animated.View style={[styles.ring, styles.ring1, { transform: [{ scale: ring1Scale }], opacity: ring1Opacity }]} />

      {/* Glow behind icon */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Icon */}
      <Animated.View style={[
        styles.iconWrapper,
        { transform: [{ scale: iconScale }, { rotate }], opacity: iconOpacity }
      ]}>
        <LinearGradient
          colors={[COLORS.primary, '#6D28D9', COLORS.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconGradient}
        >
          <Text style={styles.iconEmoji}>🔧</Text>
        </LinearGradient>
      </Animated.View>

      {/* Text */}
      <Animated.Text style={[styles.appName, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
        Hunar<Text style={styles.appNameAccent}>Hub</Text>
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: tagOpacity }]}>
        Skilled Workers, One Tap Away
      </Animated.Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0F',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  ring1: { width: 180, height: 180 },
  ring2: { width: 280, height: 280 },
  ring3: { width: 380, height: 380 },
  glow: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: COLORS.primary,
    opacity: 0.15,
  },
  iconWrapper: {
    marginBottom: SIZES.extraLarge,
    zIndex: 10,
  },
  iconGradient: {
    width: 120,
    height: 120,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.8,
    shadowRadius: 25,
  },
  iconEmoji: {
    fontSize: 58,
  },
  appName: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: SIZES.base,
  },
  appNameAccent: {
    color: COLORS.primary,
  },
  tagline: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    letterSpacing: 0.8,
  },
});

export default SplashScreen;
