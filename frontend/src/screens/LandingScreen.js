import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../theme/Theme';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'flash-outline',     title: 'Instant Booking',   desc: 'Book a skilled worker in seconds',     color: '#FFD700' },
  { icon: 'shield-checkmark-outline', title: 'Verified Workers', desc: 'Approved & rated professionals only', color: '#00E676' },
  { icon: 'chatbubble-outline', title: 'Direct Chat',      desc: 'Talk to workers before you hire',      color: '#7C3AED' },
  { icon: 'location-outline',  title: 'Near You',          desc: 'Find workers in your city instantly',  color: '#FF6B6B' },
];

const FeatureItem = ({ icon, title, desc, color, delay }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const x       = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(x,       { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.featureRow, { opacity, transform: [{ translateX: x }] }]}>
      <View style={[styles.featureIconBox, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDesc}>{desc}</Text>
      </View>
    </Animated.View>
  );
};

const LandingScreen = ({ navigation }) => {
  const heroScale   = useRef(new Animated.Value(0.85)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity  = useRef(new Animated.Value(0)).current;
  const btnY        = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(heroScale,   { toValue: 1, useNativeDriver: true, tension: 70, friction: 8 }),
      Animated.timing(heroOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(600),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(btnY,       { toValue: 0, useNativeDriver: true, tension: 70, friction: 8 }),
      ]),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient colors={['#07070D', '#0A0A0F', '#0A0A0F']} style={StyleSheet.absoluteFill} />
      <View style={[styles.bgCircle, styles.bgCircle1]} />
      <View style={[styles.bgCircle, styles.bgCircle2]} />

      {/* Hero */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity, transform: [{ scale: heroScale }] }]}>
        <LinearGradient
          colors={[COLORS.primary, '#6D28D9', COLORS.secondary]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.logoBox}
        >
          <Text style={styles.logoText}>HH</Text>
        </LinearGradient>

        <Text style={styles.appName}>
          Hunar<Text style={styles.appNameAccent}>Hub</Text>
        </Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Ionicons name="location-outline" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>Made for Pakistan</Text>
          </View>
        </View>
        <Text style={styles.heroTagline}>
          Find trusted skilled workers{'\n'}in your city — fast & easy
        </Text>
      </Animated.View>

      {/* Features */}
      <View style={styles.features}>
        {FEATURES.map((f, i) => (
          <FeatureItem key={i} {...f} delay={400 + i * 120} />
        ))}
      </View>

      {/* Buttons */}
      <Animated.View style={[styles.buttons, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>Login</Text>
            <Ionicons name="arrow-forward" size={18} color="#000" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation.navigate('Signup')} activeOpacity={0.85}>
          <Text style={styles.btnSecondaryText}>Create Free Account</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A0A0F',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.extraLarge * 2.2,
    paddingBottom: SIZES.padding,
  },
  bgCircle: { position: 'absolute', borderRadius: 999, backgroundColor: COLORS.primary },
  bgCircle1: { width: 300, height: 300, top: -120, right: -100, opacity: 0.05 },
  bgCircle2: { width: 200, height: 200, bottom: 60, left: -80, opacity: 0.04 },
  hero: { alignItems: 'center', marginBottom: SIZES.extraLarge },
  logoBox: {
    width: 88, height: 88, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.padding, elevation: 20,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 20,
  },
  logoText: { fontSize: 28, fontWeight: '900', color: '#FFF', letterSpacing: 2 },
  appName: { fontSize: 42, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 1.5, marginBottom: SIZES.base },
  appNameAccent: { color: COLORS.primary },
  badgeRow: { flexDirection: 'row', marginBottom: SIZES.small },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  badgeText: { ...FONTS.small, color: COLORS.primary, fontWeight: '600' },
  heroTagline: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24, marginTop: SIZES.base / 2 },
  features: { marginBottom: SIZES.large },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.small + 2 },
  featureIconBox: {
    width: 46, height: 46, borderRadius: 13, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginRight: SIZES.padding,
  },
  featureText: { flex: 1 },
  featureTitle: { ...FONTS.body, color: COLORS.text, fontWeight: 'bold' },
  featureDesc: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 1 },
  buttons: { alignItems: 'center', marginTop: SIZES.base },
  btnPrimary: {
    width: width - SIZES.padding * 2, paddingVertical: 16,
    borderRadius: SIZES.radius, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SIZES.small + 4, elevation: 10,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 12,
  },
  btnPrimaryText: { ...FONTS.large, color: '#000', fontWeight: 'bold', letterSpacing: 0.5 },
  btnSecondary: {
    width: width - SIZES.padding * 2, paddingVertical: 15,
    borderRadius: SIZES.radius, alignItems: 'center',
    borderWidth: 1.5, borderColor: COLORS.primary,
  },
  btnSecondaryText: { ...FONTS.large, color: COLORS.primary, fontWeight: 'bold', letterSpacing: 0.5 },
});

export default LandingScreen;
