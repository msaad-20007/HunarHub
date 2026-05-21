import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert,
  TouchableOpacity, Animated, Dimensions, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import CustomInput from '../../components/CustomInput';
import GradientButton from '../../components/GradientButton';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { updateUserRole }      = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await authAPI.login({ email: email.trim(), password });
      await AsyncStorage.setItem('userId',   data.userId.toString());
      await AsyncStorage.setItem('userName', data.name || '');
      await updateUserRole(data.role);
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#050A14', '#0D1B2A', '#121212']} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <View style={styles.backBtnInner}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideY }] }]}>

          {/* Logo */}
          <LinearGradient
            colors={[COLORS.primary, '#0066CC', COLORS.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoEmoji}>🔧</Text>
          </LinearGradient>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Login to your HunarHub account</Text>

          {/* Form card */}
          <View style={styles.card}>
            <CustomInput
              label="Email"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <GradientButton
              title={loading ? 'Logging in...' : 'Login  →'}
              onPress={handleLogin}
              style={{ marginTop: SIZES.large }}
            />

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={{ alignItems: 'center', marginTop: SIZES.padding }}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>
                Forgot Password?
              </Text>
            </TouchableOpacity>
          </View>

          {/* Switch to signup */}
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.switchRow}>
            <Text style={styles.switchText}>Don't have an account? </Text>
            <Text style={styles.switchLink}>Sign Up</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D1B2A',
  },
  backBtn: {
    position: 'absolute',
    top: SIZES.extraLarge * 1.8,
    left: SIZES.padding,
    zIndex: 10,
  },
  backBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  backArrow: {
    color: COLORS.primary,
    fontSize: 16,
    marginRight: 5,
    fontWeight: 'bold',
  },
  backText: {
    ...FONTS.small,
    color: COLORS.primary,
    fontWeight: '600',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.extraLarge * 4,
    paddingBottom: SIZES.extraLarge,
  },
  content: {
    alignItems: 'center',
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SIZES.padding,
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  logoEmoji: { fontSize: 36 },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: SIZES.base / 2,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    marginBottom: SIZES.extraLarge,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: SIZES.padding,
    borderRadius: SIZES.radius + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 5,
    marginBottom: SIZES.extraLarge,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  switchLink: {
    ...FONTS.body,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
