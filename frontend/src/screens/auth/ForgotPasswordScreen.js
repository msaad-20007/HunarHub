import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Alert, TouchableOpacity,
  Animated, KeyboardAvoidingView, Platform, ScrollView, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';
import { authAPI } from '../../services/api';

const Steps = ({ current }) => (
  <View style={s.steps}>
    {[1, 2, 3].map((n) => (
      <View key={n} style={s.stepRow}>
        <View style={[s.stepDot, current >= n && s.stepDotActive]}>
          {current > n
            ? <Ionicons name="checkmark" size={14} color="#00E676" />
            : <Text style={[s.stepNum, current === n && s.stepNumActive]}>{n}</Text>}
        </View>
        {n < 3 && <View style={[s.stepLine, current > n && s.stepLineActive]} />}
      </View>
    ))}
  </View>
);

const OtpInput = ({ value, onChange }) => {
  const refs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const digits = value.split('');
  const handleKey = (index, text) => {
    const d = text.replace(/\D/g, '').slice(-1);
    const arr = value.split('');
    arr[index] = d;
    onChange(arr.join(''));
    if (d && index < 5) refs[index + 1].current?.focus();
    if (!d && index > 0) refs[index - 1].current?.focus();
  };
  return (
    <View style={s.otpRow}>
      {[0,1,2,3,4,5].map((i) => (
        <TextInput
          key={i} ref={refs[i]}
          style={[s.otpBox, digits[i] && s.otpBoxFilled]}
          value={digits[i] || ''}
          onChangeText={(t) => handleKey(i, t)}
          keyboardType="number-pad" maxLength={1} selectTextOnFocus
        />
      ))}
    </View>
  );
};

const ForgotPasswordScreen = ({ navigation }) => {
  const [step, setStep]           = useState(1);
  const [email, setEmail]         = useState('');
  const [otp, setOtp]             = useState('');
  const [newPass, setNewPass]     = useState('');
  const [confirmPass, setConfirm] = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [resendTimer, setTimer]   = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(24)).current;
  const timerRef = useRef(null);

  useEffect(() => { animateIn(); return () => clearInterval(timerRef.current); }, []);

  const animateIn = () => {
    fadeAnim.setValue(0); slideY.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  };

  const goStep = (n) => { setStep(n); animateIn(); };

  const startResendTimer = () => {
    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!email.trim()) { Alert.alert('Required', 'Please enter your email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { Alert.alert('Invalid', 'Please enter a valid email address.'); return; }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      startResendTimer(); goStep(2);
    } catch (e) { Alert.alert('Error', e.message || 'Failed to send code.'); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { Alert.alert('Required', 'Enter the 6-digit code.'); return; }
    setLoading(true);
    try {
      await authAPI.verifyOtp(email.trim().toLowerCase(), otp);
      goStep(3);
    } catch (e) { Alert.alert('Invalid Code', e.message || 'The code is incorrect or expired.'); setOtp(''); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setOtp(''); startResendTimer();
      Alert.alert('Sent', 'A new code has been sent to your email.');
    } catch (e) { Alert.alert('Error', e.message || 'Failed to resend code.'); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!newPass.trim()) { Alert.alert('Required', 'Please enter a new password.'); return; }
    if (newPass.length < 6) { Alert.alert('Too Short', 'Password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { Alert.alert('Mismatch', 'Passwords do not match.'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword(email.trim().toLowerCase(), newPass);
      Alert.alert('Password Reset', 'Your password has been updated. Please login.',
        [{ text: 'Login Now', onPress: () => navigation.replace('Login') }]);
    } catch (e) { Alert.alert('Error', e.message || 'Failed to reset password.'); }
    finally { setLoading(false); }
  };

  const STEP_META = [
    { icon: 'mail-outline',        color: '#FF6B35', title: 'Forgot Password?',  subtitle: "Enter your email and we'll send\na 6-digit verification code" },
    { icon: 'keypad-outline',      color: '#00D2FF', title: 'Enter Code',        subtitle: `We sent a 6-digit code to\n${email}` },
    { icon: 'lock-closed-outline', color: '#00E676', title: 'New Password',      subtitle: 'Create a strong password\nfor your account' },
  ];
  const meta = STEP_META[step - 1];

  const renderStep = () => {
    if (step === 1) return (
      <View style={s.card}>
        <Text style={s.label}>EMAIL ADDRESS</Text>
        <View style={s.inputWrap}>
          <Ionicons name="mail-outline" size={18} color="#3A5568" style={s.inputIcon} />
          <TextInput
            style={s.input} placeholder="Enter your email" placeholderTextColor="#3A5568"
            value={email} onChangeText={setEmail} keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false}
          />
        </View>
        <GradientButton title={loading ? 'Sending...' : 'Send Code'} onPress={handleSendOtp} style={{ marginTop: SIZES.large }} />
      </View>
    );

    if (step === 2) return (
      <View style={s.card}>
        <Text style={s.label}>VERIFICATION CODE</Text>
        <OtpInput value={otp} onChange={setOtp} />
        <GradientButton title={loading ? 'Verifying...' : 'Verify Code'} onPress={handleVerifyOtp} style={{ marginTop: SIZES.large }} />
        <TouchableOpacity style={s.resendRow} onPress={handleResend} disabled={resendTimer > 0}>
          {resendTimer > 0
            ? <Text style={s.resendTimer}>Resend code in {resendTimer}s</Text>
            : <Text style={s.resendLink}>Didn't receive it? <Text style={s.resendLinkBold}>Resend</Text></Text>
          }
        </TouchableOpacity>
        <TouchableOpacity style={s.changeRow} onPress={() => { setOtp(''); goStep(1); }}>
          <Ionicons name="chevron-back" size={14} color="#3A5568" />
          <Text style={s.changeText}>Change email</Text>
        </TouchableOpacity>
      </View>
    );

    if (step === 3) return (
      <View style={s.card}>
        <Text style={s.label}>NEW PASSWORD</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#3A5568" style={s.inputIcon} />
          <TextInput
            style={s.input} placeholder="Min. 6 characters" placeholderTextColor="#3A5568"
            value={newPass} onChangeText={setNewPass} secureTextEntry={!showPass}
          />
          <TouchableOpacity onPress={() => setShowPass(v => !v)} style={s.eyeBtn}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="#3A5568" />
          </TouchableOpacity>
        </View>

        <Text style={[s.label, { marginTop: 16 }]}>CONFIRM PASSWORD</Text>
        <View style={s.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#3A5568" style={s.inputIcon} />
          <TextInput
            style={s.input} placeholder="Re-enter password" placeholderTextColor="#3A5568"
            value={confirmPass} onChangeText={setConfirm} secureTextEntry={!showPass}
          />
        </View>

        {newPass.length > 0 && (
          <View style={s.strengthRow}>
            {[1,2,3,4].map(i => (
              <View key={i} style={[s.strengthBar,
                newPass.length >= i * 3 && { backgroundColor: newPass.length < 6 ? '#FF4C4C' : newPass.length < 9 ? '#FFC107' : '#00E676' }
              ]} />
            ))}
            <Text style={s.strengthLabel}>{newPass.length < 6 ? 'Weak' : newPass.length < 9 ? 'Fair' : 'Strong'}</Text>
          </View>
        )}

        <GradientButton title={loading ? 'Resetting...' : 'Reset Password'} onPress={handleReset} style={{ marginTop: SIZES.large }} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={['#050A14', '#0D1B2A', '#121212']} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <View style={s.backBtnInner}>
          <Ionicons name="chevron-back" size={18} color={COLORS.primary} />
          <Text style={s.backText}>Back</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Steps current={step} />

        <Animated.View style={[s.content, { opacity: fadeAnim, transform: [{ translateY: slideY }] }]}>
          {/* Step icon */}
          <View style={s.iconWrap}>
            <LinearGradient colors={[meta.color + '20', meta.color + '08']} style={[s.iconBg, { borderColor: meta.color + '30' }]}>
              <Ionicons name={meta.icon} size={36} color={meta.color} />
            </LinearGradient>
          </View>
          <Text style={s.title}>{meta.title}</Text>
          <Text style={s.subtitle}>{meta.subtitle}</Text>
          {renderStep()}
        </Animated.View>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={s.loginRow}>
          <Text style={s.loginText}>Remember your password? </Text>
          <Text style={s.loginLink}>Login</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1B2A' },
  backBtn: { position: 'absolute', top: SIZES.extraLarge * 1.8, left: SIZES.padding, zIndex: 10 },
  backBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backText: { color: COLORS.primary, fontSize: 13, fontWeight: '600', marginLeft: 2 },
  scroll: { flexGrow: 1, paddingHorizontal: SIZES.padding, paddingTop: SIZES.extraLarge * 3.5, paddingBottom: 40 },
  content: { alignItems: 'center' },
  steps: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.extraLarge },
  stepRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#0B1825', borderWidth: 1.5, borderColor: '#162535',
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotActive: { backgroundColor: '#00D2FF18', borderColor: '#00D2FF' },
  stepNum: { fontSize: 13, color: '#3A5568', fontWeight: '700' },
  stepNumActive: { color: '#00D2FF' },
  stepLine: { width: 40, height: 1.5, backgroundColor: '#162535', marginHorizontal: 4 },
  stepLineActive: { backgroundColor: '#00D2FF60' },
  iconWrap: { marginBottom: 20 },
  iconBg: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  title: { fontSize: 28, fontWeight: '900', color: '#D8EAF8', letterSpacing: 0.3, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#3A5568', textAlign: 'center', lineHeight: 22, marginBottom: SIZES.extraLarge },
  card: {
    width: '100%', backgroundColor: 'rgba(11,24,37,0.95)',
    padding: SIZES.padding, borderRadius: 20,
    borderWidth: 1, borderColor: '#162535', marginBottom: SIZES.extraLarge,
  },
  label: { fontSize: 11, color: '#3A5568', fontWeight: '800', letterSpacing: 1.5, marginBottom: 8 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#060E18', borderRadius: 14,
    borderWidth: 1, borderColor: '#162535', paddingHorizontal: 14, marginBottom: 4,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: '#D8EAF8', fontSize: 15, paddingVertical: 14 },
  eyeBtn: { padding: 6 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  otpBox: {
    width: 46, height: 56, borderRadius: 14,
    backgroundColor: '#060E18', borderWidth: 1.5, borderColor: '#162535',
    textAlign: 'center', fontSize: 22, fontWeight: '800', color: '#D8EAF8',
  },
  otpBoxFilled: { borderColor: '#00D2FF', backgroundColor: '#00D2FF10' },
  resendRow: { alignItems: 'center', marginTop: 16 },
  resendTimer: { fontSize: 13, color: '#3A5568' },
  resendLink: { fontSize: 13, color: '#3A5568' },
  resendLinkBold: { color: '#00D2FF', fontWeight: '700' },
  changeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  changeText: { fontSize: 13, color: '#3A5568' },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#162535' },
  strengthLabel: { fontSize: 11, color: '#3A5568', marginLeft: 6, fontWeight: '700', width: 40 },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14, color: '#3A5568' },
  loginLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },
});

export default ForgotPasswordScreen;
