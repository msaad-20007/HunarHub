import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const InfoRow = ({ iconName, label, value }) => (
  <View style={s.infoRow}>
    <View style={s.infoIconBox}>
      <Ionicons name={iconName} size={20} color="#E8621A" />
    </View>
    <View style={s.infoContent}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const { updateUserRole }    = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(20)).current;

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setLoading(false); return; }
      const data = await userAPI.getProfile(userId);
      setUser(data);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
      ]).start();
    } catch (e) {
      console.error(e);
      const role = await AsyncStorage.getItem('userRole');
      setUser({ name: 'User', role: role || 'CUSTOMER' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.multiRemove(['userRole', 'userId']);
        await updateUserRole(null);
      }},
    ]);
  };

  const initials = user?.name ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  const roleLabel = user?.role === 'CUSTOMER' ? 'Customer' : user?.role === 'WORKER' ? 'Worker' : 'Admin';
  const roleIcon  = user?.role === 'CUSTOMER' ? 'person-outline' : user?.role === 'WORKER' ? 'construct-outline' : 'shield-outline';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0806" />
      <LinearGradient colors={['#0A0806', '#0F0D0A']} style={StyleSheet.absoluteFill} />

      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <View style={s.backBtnInner}>
          <Ionicons name="chevron-back" size={18} color="#F5A623" />
          <Text style={s.backTxt}>Back</Text>
        </View>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#F5A623" />
          <Text style={s.loadingTxt}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideY }] }}>

            {/* Hero */}
            <LinearGradient colors={['#1C1812', '#2A2018']} style={s.hero}>
              <LinearGradient colors={['#F5A62315', 'transparent']} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['#E8621A', '#F5A623']} style={s.avatar}>
                <Text style={s.avatarTxt}>{initials}</Text>
              </LinearGradient>
              <Text style={s.name}>{user?.name || 'User'}</Text>
              <View style={s.roleBadge}>
                <Ionicons name={roleIcon} size={14} color="#F5A623" style={{ marginRight: 6 }} />
                <Text style={s.roleTxt}>{roleLabel}</Text>
              </View>
              {user?.city ? (
                <View style={s.cityRow}>
                  <Ionicons name="location-outline" size={13} color="#6B5D4F" style={{ marginRight: 4 }} />
                  <Text style={s.cityTxt}>{user.city}</Text>
                </View>
              ) : null}
            </LinearGradient>

            {/* Contact info */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>CONTACT INFO</Text>
              <InfoRow iconName="mail-outline"     label="Email"         value={user?.email} />
              <InfoRow iconName="call-outline"     label="Phone"         value={user?.phone} />
              <InfoRow iconName="map-outline"      label="City"          value={user?.city} />
              {user?.dob ? <InfoRow iconName="gift-outline" label="Date of Birth" value={user.dob} /> : null}
            </View>

            {/* Worker-specific info */}
            {user?.role === 'WORKER' && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>WORKER INFO</Text>
                <InfoRow iconName="construct-outline"        label="Category"       value={user?.category} />
                <InfoRow iconName="card-outline"             label="CNIC"           value={user?.cnic} />
                <InfoRow iconName="logo-whatsapp"            label="WhatsApp"       value={user?.whatsapp} />
                <InfoRow iconName="star-outline"             label="Rating"         value={user?.rating ? `${Number(user.rating).toFixed(1)} / 5.0` : 'No ratings yet'} />
                <InfoRow iconName="shield-checkmark-outline" label="Approval Status" value={user?.approvalStatus} />
              </View>
            )}

            {/* Account */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>ACCOUNT</Text>
              <View style={s.accountCard}>
                <TouchableOpacity style={s.accountRow} activeOpacity={0.7}>
                  <View style={s.accountIconBox}>
                    <Ionicons name="lock-closed-outline" size={18} color="#E8621A" />
                  </View>
                  <Text style={s.accountTxt}>Change Password</Text>
                  <Ionicons name="chevron-forward" size={18} color="#6B5D4F" />
                </TouchableOpacity>
                <View style={s.accountDivider} />
                <TouchableOpacity style={s.accountRow} onPress={handleLogout} activeOpacity={0.7}>
                  <View style={[s.accountIconBox, { backgroundColor: '#FF4C4C12', borderColor: '#FF4C4C25' }]}>
                    <Ionicons name="log-out-outline" size={18} color="#FF4C4C" />
                  </View>
                  <Text style={[s.accountTxt, { color: '#FF4C4C' }]}>Logout</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FF4C4C60" />
                </TouchableOpacity>
              </View>
            </View>

          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0F0D0A' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { color: '#6B5D4F', fontSize: 14, marginTop: 12 },
  backBtn: { position: 'absolute', top: SIZES.extraLarge * 1.8, left: SIZES.padding, zIndex: 10 },
  backBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  backTxt: { color: '#F5A623', fontSize: 13, fontWeight: '600', marginLeft: 2 },
  scroll: { paddingTop: SIZES.extraLarge * 3.5, paddingBottom: 40 },
  hero: {
    marginHorizontal: SIZES.padding, borderRadius: 24, borderWidth: 1, borderColor: '#2A2018',
    padding: SIZES.padding + 4, alignItems: 'center', marginBottom: SIZES.base, overflow: 'hidden',
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14,
    shadowColor: '#E8621A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 12,
  },
  avatarTxt: { fontSize: 34, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 24, fontWeight: '800', color: '#F5EFE6', marginBottom: 10 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5A62315', borderRadius: 20, borderWidth: 1, borderColor: '#F5A62330', paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 },
  roleTxt: { color: '#F5A623', fontWeight: '700', fontSize: 14 },
  cityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cityTxt: { color: '#6B5D4F', fontSize: 13 },
  section: { marginHorizontal: SIZES.padding, marginBottom: SIZES.base },
  sectionTitle: { fontSize: 11, color: '#4A3D30', fontWeight: '800', letterSpacing: 2, marginBottom: 10, marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1812', borderRadius: 14, borderWidth: 1, borderColor: '#2E2820', padding: 14, marginBottom: 8 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8621A12', borderWidth: 1, borderColor: '#E8621A25', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6B5D4F', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#F5EFE6', fontWeight: '600' },
  accountCard: { backgroundColor: '#1C1812', borderRadius: 14, borderWidth: 1, borderColor: '#2E2820', overflow: 'hidden' },
  accountRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  accountIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#E8621A12', borderWidth: 1, borderColor: '#E8621A25', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  accountTxt: { flex: 1, fontSize: 15, color: '#F5EFE6', fontWeight: '600' },
  accountDivider: { height: 1, backgroundColor: '#2E2820' },
});

export default ProfileScreen;
