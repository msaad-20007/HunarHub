import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  TouchableOpacity, Platform, Animated, Modal, FlatList
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import CustomInput from '../../components/CustomInput';
import GradientButton from '../../components/GradientButton';
import CityPicker from '../../components/CityPicker';
import { authAPI } from '../../services/api';

const WORKER_CATEGORIES = [
  { label: 'Plumber',      icon: '🔧' },
  { label: 'Electrician',  icon: '⚡' },
  { label: 'Painter',      icon: '🎨' },
  { label: 'AC Repair',    icon: '❄️' },
  { label: 'Carpenter',    icon: '🪚' },
  { label: 'Mechanic',     icon: '🔩' },
  { label: 'Welder',       icon: '🔥' },
  { label: 'Qasai',        icon: '🥩' },
];

// Custom category picker (same dark-theme approach as CityPicker)
const CategoryPicker = ({ selectedValue, onValueChange }) => {
  const [visible, setVisible] = useState(false);
  const selected = WORKER_CATEGORIES.find(c => c.label === selectedValue) || WORKER_CATEGORIES[0];

  return (
    <View style={styles.pickerWrap}>
      <Text style={styles.pickerLabel}>Service Category</Text>
      <TouchableOpacity style={styles.pickerSelector} onPress={() => setVisible(true)} activeOpacity={0.7}>
        <Text style={styles.pickerValue}>{selected.icon}  {selected.label}</Text>
        <Text style={styles.pickerArrow}>▾</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setVisible(false)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select Category</Text>
            <FlatList
              data={WORKER_CATEGORIES}
              keyExtractor={item => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.label === selectedValue && styles.optionActive]}
                  onPress={() => { onValueChange(item.label); setVisible(false); }}
                >
                  <Text style={styles.optionText}>{item.icon}  {item.label}</Text>
                  {item.label === selectedValue && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const SignupScreen = ({ navigation }) => {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [city, setCity]         = useState('Rawalpindi');
  const [role, setRole]         = useState('CUSTOMER');
  const [whatsapp, setWhatsapp] = useState('');
  const [cnic, setCnic]         = useState('');
  const [category, setCategory] = useState(WORKER_CATEGORIES[0].label);
  const [dob, setDob]           = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading]   = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, []);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      Alert.alert('Missing Fields', 'Please fill in all required fields.');
      return;
    }
    setLoading(true);
    try {
      const userData = { name, email, password, phone, city, role, dob: dob.toISOString().split('T')[0] };
      if (role === 'WORKER') {
        if (!cnic || !whatsapp) throw new Error('CNIC and WhatsApp are required for workers.');
        userData.category = category;
        userData.cnic     = cnic;
        userData.whatsapp = whatsapp;
      }
      await authAPI.register(userData);
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'Login', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error) {
      Alert.alert('Signup Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#050A14', '#0D1B2A', '#121212']} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <View style={styles.backBtnInner}>
          <Text style={styles.backArrow}>←</Text>
          <Text style={styles.backText}>Back</Text>
        </View>
      </TouchableOpacity>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideY }] }]}>

          {/* Logo */}
          <LinearGradient
            colors={[COLORS.primary, '#0066CC', COLORS.secondary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoEmoji}>🔧</Text>
          </LinearGradient>

          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join HunarHub today — it's free</Text>

          {/* Role toggle */}
          <View style={styles.roleToggle}>
            {['CUSTOMER', 'WORKER'].map(r => (
              <TouchableOpacity
                key={r}
                style={[styles.roleBtn, role === r && styles.roleBtnActive]}
                onPress={() => setRole(r)}
                activeOpacity={0.8}
              >
                <Text style={styles.roleIcon}>{r === 'CUSTOMER' ? '👤' : '🔧'}</Text>
                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                  {r === 'CUSTOMER' ? 'Customer' : 'Worker'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Form */}
          <View style={styles.card}>
            <CustomInput label="Full Name"    placeholder="Enter your full name"    value={name}     onChangeText={setName} />
            <CustomInput label="Email"        placeholder="Enter your email"        value={email}    onChangeText={setEmail}    keyboardType="email-address" />
            <CustomInput label="Password"     placeholder="Create a password"       value={password} onChangeText={setPassword} secureTextEntry />
            <CustomInput label="Phone Number" placeholder="03XX-XXXXXXX"           value={phone}    onChangeText={setPhone}    keyboardType="phone-pad" />

            {/* Date of Birth */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Date of Birth</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
                <Text style={styles.dateBtnText}>📅  {dob.toDateString()}</Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker value={dob} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
            )}

            <CityPicker selectedValue={city} onValueChange={setCity} />

            {/* Worker-only fields */}
            {role === 'WORKER' && (
              <>
                <View style={styles.workerDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>Worker Details</Text>
                  <View style={styles.dividerLine} />
                </View>
                <CustomInput label="WhatsApp Number" placeholder="03XX-XXXXXXX"           value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
                <CustomInput label="CNIC Number"     placeholder="Without dashes (13 digits)" value={cnic}     onChangeText={setCnic}     keyboardType="numeric" />
                <CategoryPicker selectedValue={category} onValueChange={setCategory} />
              </>
            )}

            <GradientButton
              title={loading ? 'Creating Account...' : 'Sign Up  →'}
              onPress={handleSignup}
              style={{ marginTop: SIZES.large }}
            />
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchRow}>
            <Text style={styles.switchText}>Already have an account? </Text>
            <Text style={styles.switchLink}>Login</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D1B2A' },
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
  backArrow: { color: COLORS.primary, fontSize: 16, marginRight: 5, fontWeight: 'bold' },
  backText:  { ...FONTS.small, color: COLORS.primary, fontWeight: '600' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.extraLarge * 4,
    paddingBottom: SIZES.extraLarge * 2,
  },
  content: { alignItems: 'center' },
  logoBox: {
    width: 76, height: 76, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: SIZES.padding,
    elevation: 15,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 15,
  },
  logoEmoji: { fontSize: 36 },
  title: { fontSize: 30, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5, marginBottom: SIZES.base / 2 },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, marginBottom: SIZES.large },
  roleToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.large,
    overflow: 'hidden',
    width: '100%',
  },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: SIZES.small + 2,
    gap: 6,
  },
  roleBtnActive: { backgroundColor: 'rgba(0,210,255,0.15)', borderWidth: 0 },
  roleIcon: { fontSize: 16 },
  roleText: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '600' },
  roleTextActive: { color: COLORS.primary },
  card: {
    width: '100%',
    backgroundColor: 'rgba(30,30,30,0.9)',
    padding: SIZES.padding,
    borderRadius: SIZES.radius + 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SIZES.extraLarge,
  },
  fieldWrap: { marginVertical: SIZES.base },
  fieldLabel: { ...FONTS.body, color: COLORS.text, marginBottom: SIZES.base / 2 },
  dateBtn: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.small,
  },
  dateBtnText: { ...FONTS.body, color: COLORS.text },
  workerDivider: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: SIZES.padding,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { ...FONTS.small, color: COLORS.primary, marginHorizontal: SIZES.base, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  switchText: { ...FONTS.body, color: COLORS.textSecondary },
  switchLink: { ...FONTS.body, color: COLORS.primary, fontWeight: 'bold' },

  // CategoryPicker styles
  pickerWrap: { marginVertical: SIZES.base },
  pickerLabel: { ...FONTS.body, color: COLORS.text, marginBottom: SIZES.base / 2 },
  pickerSelector: {
    backgroundColor: COLORS.background,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerValue: { ...FONTS.body, color: COLORS.text },
  pickerArrow: { color: COLORS.primary, fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modal: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius,
    width: '80%', maxHeight: '60%',
    paddingVertical: SIZES.base,
    borderWidth: 1, borderColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.large, color: COLORS.primary, textAlign: 'center',
    paddingVertical: SIZES.small,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    marginBottom: SIZES.base,
  },
  option: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: SIZES.small, paddingHorizontal: SIZES.padding,
  },
  optionActive: { backgroundColor: 'rgba(0,210,255,0.1)' },
  optionText: { ...FONTS.body, color: COLORS.text },
  check: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
});

export default SignupScreen;
