import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import CustomInput from '../../components/CustomInput';
import GradientButton from '../../components/GradientButton';
import { authAPI } from '../../services/api';

const LoginScreen = ({ navigation, route }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUserRole } = route.params;

  const handleLogin = async () => {
    try {
      const data = await authAPI.login({ email, password });
      await AsyncStorage.setItem('userRole', data.role);
      await AsyncStorage.setItem('userId', data.userId.toString());
      Alert.alert("Success", "Logged in successfully!");
      setUserRole(data.role);
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HunarHub</Text>
      <Text style={styles.subtitle}>Login to your premium account</Text>
      
      <View style={styles.form}>
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
          title="Login" 
          onPress={handleLogin} 
          style={{ marginTop: SIZES.large }}
        />
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('Signup')} style={styles.footer}>
        <Text style={styles.footerText}>Don't have an account? <Text style={styles.link}>Sign Up</Text></Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    justifyContent: 'center',
  },
  title: {
    ...FONTS.title,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: SIZES.base,
  },
  subtitle: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SIZES.extraLarge,
  },
  form: {
    backgroundColor: COLORS.card,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    elevation: 2,
  },
  footer: {
    marginTop: SIZES.extraLarge,
    alignItems: 'center',
  },
  footerText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
