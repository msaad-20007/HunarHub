import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import CustomInput from '../../components/CustomInput';
import GradientButton from '../../components/GradientButton';
import CityPicker from '../../components/CityPicker';
import { authAPI } from '../../services/api';

const WORKER_CATEGORIES = ['Plumber', 'Electrician', 'Painter', 'AC Repair', 'Carpenter', 'Mechanic', 'Welder', 'Qasai'];

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Rawalpindi');
  const [role, setRole] = useState('CUSTOMER');
  
  // Extra fields
  const [whatsapp, setWhatsapp] = useState('');
  const [cnic, setCnic] = useState('');
  const [category, setCategory] = useState(WORKER_CATEGORIES[0]);
  const [dob, setDob] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  const handleSignup = async () => {
    try {
      const userData = { 
        name, email, password, phone, city, role,
        dob: dob.toISOString().split('T')[0] 
      };

      if (role === 'WORKER') {
        if (!cnic || !whatsapp) throw new Error("CNIC and WhatsApp are required for workers.");
        userData.category = category;
        userData.cnic = cnic;
        userData.whatsapp = whatsapp;
      }

      await authAPI.register(userData);
      Alert.alert("Success", "Account created successfully! Please login.");
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert("Signup Failed", error.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join HunarHub today</Text>
      
      <View style={styles.form}>
        <View style={styles.roleSelector}>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'CUSTOMER' && styles.roleBtnActive]}
            onPress={() => setRole('CUSTOMER')}
          >
            <Text style={styles.roleText}>Customer</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.roleBtn, role === 'WORKER' && styles.roleBtnActive]}
            onPress={() => setRole('WORKER')}
          >
            <Text style={styles.roleText}>Worker</Text>
          </TouchableOpacity>
        </View>

        <CustomInput label="Full Name" placeholder="Enter your full name" value={name} onChangeText={setName} />
        <CustomInput label="Email" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <CustomInput label="Password" placeholder="Enter your password" secureTextEntry value={password} onChangeText={setPassword} />
        <CustomInput label="Phone" placeholder="Enter your phone number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        
        <View style={{ marginVertical: SIZES.base }}>
          <Text style={{ ...FONTS.body, marginBottom: SIZES.base / 2 }}>Date of Birth</Text>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerBtn}>
            <Text style={{ color: COLORS.text }}>{dob.toDateString()}</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && (
          <DateTimePicker value={dob} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
        )}

        <CityPicker selectedValue={city} onValueChange={setCity} />

        {role === 'WORKER' && (
          <>
            <CustomInput label="WhatsApp Number" placeholder="Enter WhatsApp number" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
            <CustomInput label="CNIC Number" placeholder="Enter CNIC without dashes" value={cnic} onChangeText={setCnic} keyboardType="numeric" />
            <View style={{ marginVertical: SIZES.base }}>
              <Text style={{ ...FONTS.body, marginBottom: SIZES.base / 2 }}>Service Category</Text>
              <View style={styles.pickerContainer}>
                <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker} dropdownIconColor={COLORS.primary}>
                  {WORKER_CATEGORIES.map((cat, index) => <Picker.Item label={cat} value={cat} key={index} color={COLORS.text} />)}
                </Picker>
              </View>
            </View>
          </>
        )}
        
        <GradientButton title="Sign Up" onPress={handleSignup} style={{ marginTop: SIZES.large }} />
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
        <Text style={styles.footerText}>Already have an account? <Text style={styles.link}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  contentContainer: { padding: SIZES.padding, paddingTop: SIZES.extraLarge * 2, paddingBottom: SIZES.extraLarge },
  title: { ...FONTS.title, color: COLORS.primary, textAlign: 'center', marginBottom: SIZES.base },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SIZES.extraLarge },
  form: { backgroundColor: COLORS.card, padding: SIZES.padding, borderRadius: SIZES.radius, elevation: 2 },
  roleSelector: { flexDirection: 'row', marginBottom: SIZES.large, backgroundColor: COLORS.background, borderRadius: SIZES.radius, overflow: 'hidden' },
  roleBtn: { flex: 1, padding: SIZES.small, alignItems: 'center' },
  roleBtnActive: { backgroundColor: COLORS.secondary },
  roleText: { ...FONTS.body, color: COLORS.text, fontWeight: 'bold' },
  datePickerBtn: { backgroundColor: COLORS.card, padding: SIZES.small, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border },
  pickerContainer: { backgroundColor: COLORS.card, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  picker: { color: COLORS.text, backgroundColor: COLORS.card },
  footer: { marginTop: SIZES.extraLarge, alignItems: 'center' },
  footerText: { ...FONTS.body, color: COLORS.textSecondary },
  link: { color: COLORS.primary, fontWeight: 'bold' },
});

export default SignupScreen;
