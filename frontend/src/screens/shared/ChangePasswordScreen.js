import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Animated, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';
import { userAPI } from '../../services/api';

const ChangePasswordScreen = ({ navigation }) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass,     setNewPass]     = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, []);

  const strength = newPass.length === 0 ? null
    : newPass.length < 6  ? 'weak'
    : newPass.length < 10 ? 'fair'
    : 'strong';
  const strengthColor = { weak: '#FF4C4C', fair: '#FFC107', strong: '#00E676' };
  const strengthFill  = { weak: 1, fair: 2, strong: 4 };

  const handleChange = async () => {
    if (!currentPass.trim()) {
      Alert.alert('Required', 'Please enter your current password.'); return;
    }
    if (!newPass.trim() || newPass.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.'); return;
    }
    if (newPass !== confirmPass) {
      Alert.alert('Mismatch', 'New passwords do not match.'); return;
    }
    if (currentPass === newPass) {
      Alert.alert('Same Password', 'New password must be different from current password.'); return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('Session expired. Please login again.');

      await userAPI.changePassword(userId, {
        currentPassword: currentPass,
        newPassword:     newPass,
      });

      Alert.alert(
        'Password Changed ✓',
        'Your password has been updated successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Failed', e.message || 'Could not change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#07070D', '#0A0A0F']} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <View style={styles.backBtnInner}>
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          <Text style={styles.backTxt}>Back</Text>
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideY }] }]}>

          {/* Icon */}
          <LinearGradient
            colors={['#7C3AED20', '#7C3AED08']}
            style={[styles.iconBg, { borderColor: '#7C3AED30' }]}
          >
            <Ionicons name="lock-closed-outline" size={36} color="#7C3AED" />
          </LinearGradient>

          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Enter your current password{'\n'}then set a new one</Text>

          {/* Form card */}
          <View style={styles.card}>

            {/* Current password */}
            <Text style={styles.label}>CURRENT PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-open-outline" size={18} color="#6B6880" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter current password"
                placeholderTextColor="#6B6880"
                value={currentPass}
                onChangeText={setCurrentPass}
                secureTextEntry={!showCurrent}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color="#6B6880"
                />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* New password */}
            <Text style={styles.label}>NEW PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B6880" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Min. 6 characters"
                placeholderTextColor="#6B6880"
                value={newPass}
                onChangeText={setNewPass}
                secureTextEntry={!showNew}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color="#6B6880"
                />
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            {strength && (
              <View style={styles.strengthRow}>
                {[1, 2, 3, 4].map(i => (
                  <View
                    key={i}
                    style={[
                      styles.strengthBar,
                      i <= strengthFill[strength] && { backgroundColor: strengthColor[strength] },
                    ]}
                  />
                ))}
                <Text style={[styles.strengthLabel, { color: strengthColor[strength] }]}>
                  {strength.charAt(0).toUpperCase() + strength.slice(1)}
                </Text>
              </View>
            )}

            {/* Confirm password */}
            <Text style={[styles.label, { marginTop: 16 }]}>CONFIRM NEW PASSWORD</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B6880" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#6B6880"
                value={confirmPass}
                onChangeText={setConfirmPass}
                secureTextEntry={!showConfirm}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={18} color="#6B6880"
                />
              </TouchableOpacity>
            </View>

            {/* Match indicator */}
            {confirmPass.length > 0 && (
              <View style={styles.matchRow}>
                <Ionicons
                  name={newPass === confirmPass ? 'checkmark-circle' : 'close-circle'}
                  size={15}
                  color={newPass === confirmPass ? '#00E676' : '#FF4C4C'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[
                  styles.matchTxt,
                  { color: newPass === confirmPass ? '#00E676' : '#FF4C4C' }
                ]}>
                  {newPass === confirmPass ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}

            <GradientButton
              title={loading ? 'Updating...' : 'Update Password'}
              onPress={handleChange}
              style={{ marginTop: SIZES.large }}
            />
          </View>

          {/* Forgot password link */}
          <TouchableOpacity
            style={styles.forgotRow}
            onPress={() => navigation.navigate('ForgotPassword')}
            activeOpacity={0.7}
          >
            <Ionicons name="help-circle-outline" size={15} color={COLORS.primary} style={{ marginRight: 5 }} />
            <Text style={styles.forgotTxt}>Forgot your current password?</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A0F' },
  backBtn: {
    position: 'absolute', top: SIZES.extraLarge * 1.8,
    left: SIZES.padding, zIndex: 10,
  },
  backBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backTxt: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginLeft: 2 },
  scroll: {
    flexGrow: 1, paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.extraLarge * 4, paddingBottom: 40,
  },
  content: { alignItems: 'center' },
  iconBg: {
    width: 80, height: 80, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, marginBottom: 20,
  },
  title: {
    fontSize: 28, fontWeight: '900', color: '#F1F0F5',
    letterSpacing: 0.3, marginBottom: 8, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: '#6B6880', textAlign: 'center',
    lineHeight: 22, marginBottom: SIZES.extraLarge,
  },
  card: {
    width: '100%', backgroundColor: 'rgba(11,24,37,0.95)',
    padding: SIZES.padding, borderRadius: 20,
    borderWidth: 1, borderColor: '#2D2640', marginBottom: SIZES.large,
  },
  label: {
    fontSize: 11, color: '#6B6880', fontWeight: '800',
    letterSpacing: 1.5, marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A0A0F', borderRadius: 14,
    borderWidth: 1, borderColor: '#2D2640',
    paddingHorizontal: 14, marginBottom: 4,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#F1F0F5', fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  divider: { height: 1, backgroundColor: '#2D2640', marginVertical: 16 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  strengthBar: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#2D2640',
  },
  strengthLabel: { fontSize: 11, fontWeight: '700', marginLeft: 6, width: 44 },
  matchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  matchTxt: { fontSize: 12, fontWeight: '600' },
  forgotRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', marginTop: 4,
  },
  forgotTxt: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
});

export default ChangePasswordScreen;
