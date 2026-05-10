import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import CustomInput from '../../components/CustomInput';
import GradientButton from '../../components/GradientButton';

const ProfileScreen = ({ navigation }) => {
  const [user, setUser] = useState({ name: '', email: '', phone: '', city: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Load mock user data or fetch from API
    setUser({
      name: "Ahmed Ali",
      email: "ahmed@example.com",
      phone: "03001234567",
      city: "Islamabad"
    });
  }, []);

  const handleSave = () => {
    setIsEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
    // TODO: Send update request to backend
  };

  const handleChangePassword = () => {
    Alert.alert("Password Reset", "A password reset link has been sent to your email.");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editBtn}>
          <Text style={styles.editText}>{isEditing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name ? user.name.charAt(0) : 'U'}</Text>
        </View>
        {!isEditing && <Text style={styles.name}>{user.name}</Text>}
        {!isEditing && <Text style={styles.email}>{user.email}</Text>}
      </View>

      <View style={styles.formSection}>
        <CustomInput 
          label="Full Name" 
          value={user.name} 
          onChangeText={(text) => setUser({...user, name: text})} 
          placeholder="Enter name"
          editable={isEditing}
        />
        <CustomInput 
          label="Email" 
          value={user.email} 
          onChangeText={(text) => setUser({...user, email: text})} 
          placeholder="Enter email"
          editable={false} // Usually don't edit email directly without verification
        />
        <CustomInput 
          label="Phone Number" 
          value={user.phone} 
          onChangeText={(text) => setUser({...user, phone: text})} 
          placeholder="Enter phone"
          editable={isEditing}
        />
        <CustomInput 
          label="City" 
          value={user.city} 
          onChangeText={(text) => setUser({...user, city: text})} 
          placeholder="Enter city"
          editable={isEditing}
        />

        {isEditing && (
          <GradientButton title="Save Changes" onPress={handleSave} style={{ marginTop: SIZES.large }} />
        )}
      </View>

      {!isEditing && (
        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={handleChangePassword}>
            <Text style={styles.actionText}>Change Password</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SIZES.padding, paddingTop: SIZES.extraLarge * 2, backgroundColor: COLORS.card,
  },
  backBtn: { padding: SIZES.small },
  backText: { ...FONTS.body, color: COLORS.primary },
  headerTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  editBtn: { padding: SIZES.small },
  editText: { ...FONTS.body, color: COLORS.secondary },
  profileSection: { alignItems: 'center', padding: SIZES.extraLarge, backgroundColor: COLORS.card, marginBottom: SIZES.base },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.base,
  },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  name: { ...FONTS.title, color: COLORS.text, marginBottom: 4 },
  email: { ...FONTS.body, color: COLORS.textSecondary },
  formSection: { padding: SIZES.padding, backgroundColor: COLORS.card, marginBottom: SIZES.base },
  accountSection: { padding: SIZES.padding, backgroundColor: COLORS.card },
  sectionTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: SIZES.small },
  actionBtn: {
    paddingVertical: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  actionText: { ...FONTS.body, color: COLORS.text },
});

export default ProfileScreen;
