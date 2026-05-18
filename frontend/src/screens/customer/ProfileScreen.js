import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated, StatusBar, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES } from '../../theme/Theme';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../services/api';

const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <View style={s.infoIconBox}>
      <Text style={s.infoIcon}>{icon}</Text>
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
      // Fallback to stored role info
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

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#020810" />
      <LinearGradient colors={['#020810', '#060E18']} style={StyleSheet.absoluteFill} />

      {/* Back button */}
      <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
        <View style={s.backBtnInner}>
          <Text style={s.backArrow}>←</Text>
          <Text style={s.backTxt}>Back</Text>
        </View>
      </TouchableOpacity>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color="#00D2FF" />
          <Text style={s.loadingTxt}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideY }] }}>

            {/* Hero */}
            <LinearGradient colors={['#0A1E32', '#0C2540']} style={s.hero}>
              <LinearGradient colors={['#00D2FF15', 'transparent']} style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['#3A7BD5', '#00D2FF']} style={s.avatar}>
                <Text style={s.avatarTxt}>{initials}</Text>
              </LinearGradient>
              <Text style={s.name}>{user?.name || 'User'}</Text>
              <View style={s.roleBadge}>
                <Text style={s.roleTxt}>
                  {user?.role === 'CUSTOMER' ? '👤 Customer' : user?.role === 'WORKER' ? '🔧 Worker' : '⚙️ Admin'}
                </Text>
              </View>
              {user?.city ? <Text style={s.cityTxt}>📍 {user.city}</Text> : null}
            </LinearGradient>

            {/* Contact info */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>CONTACT INFO</Text>
              <InfoRow icon="📧" label="Email"  value={user?.email} />
              <InfoRow icon="📞" label="Phone"  value={user?.phone} />
              <InfoRow icon="📍" label="City"   value={user?.city} />
              {user?.dob ? <InfoRow icon="🎂" label="Date of Birth" value={user.dob} /> : null}
            </View>

            {/* Worker-specific info */}
            {user?.role === 'WORKER' && (
              <View style={s.section}>
                <Text style={s.sectionTitle}>WORKER INFO</Text>
                <InfoRow icon="🔧" label="Category"       value={user?.category} />
                <InfoRow icon="🪪" label="CNIC"           value={user?.cnic} />
                <InfoRow icon="💬" label="WhatsApp"       value={user?.whatsapp} />
                <InfoRow icon="⭐" label="Rating"         value={user?.rating ? `${Number(user.rating).toFixed(1)} / 5.0` : 'No ratings yet'} />
                <InfoRow icon="✅" label="Approval Status" value={user?.approvalStatus} />
              </View>
            )}

            {/* Account section */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>ACCOUNT</Text>
              <View style={s.accountCard}>
                <TouchableOpacity style={s.accountRow} activeOpacity={0.7}>
                  <Text style={s.accountIcon}>🔒</Text>
                  <Text style={s.accountTxt}>Change Password</Text>
                  <Text style={s.accountArrow}>›</Text>
                </TouchableOpacity>
                <View style={s.accountDivider} />
                <TouchableOpacity style={s.accountRow} onPress={handleLogout} activeOpacity={0.7}>
                  <Text style={s.accountIcon}>🚪</Text>
                  <Text style={[s.accountTxt, { color: '#FF4C4C' }]}>Logout</Text>
                  <Text style={[s.accountArrow, { color: '#FF4C4C' }]}>›</Text>
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
  root:   { flex: 1, backgroundColor: '#060E18' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingTxt: { color: '#3A5568', fontSize: 14, marginTop: 12 },

  backBtn: { position: 'absolute', top: SIZES.extraLarge * 1.8, left: SIZES.padding, zIndex: 10 },
  backBtnInner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1,
    borderColor: 'rgba(0,210,255,0.25)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  backArrow: { color: '#00D2FF', fontSize: 16, marginRight: 5, fontWeight: 'bold' },
  backTxt:   { color: '#00D2FF', fontSize: 13, fontWeight: '600' },

  scroll: { paddingTop: SIZES.extraLarge * 3.5, paddingBottom: 40 },

  hero: {
    marginHorizontal: SIZES.padding, borderRadius: 24,
    borderWidth: 1, borderColor: '#0C2540',
    padding: SIZES.padding + 4, alignItems: 'center',
    marginBottom: SIZES.base, overflow: 'hidden',
  },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#3A7BD5', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 15, elevation: 12,
  },
  avatarTxt: { fontSize: 34, fontWeight: '900', color: '#FFF' },
  name:      { fontSize: 24, fontWeight: '800', color: '#D8EAF8', marginBottom: 10 },
  roleBadge: { backgroundColor: '#00D2FF15', borderRadius: 20, borderWidth: 1, borderColor: '#00D2FF30', paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8 },
  roleTxt:   { color: '#00D2FF', fontWeight: '700', fontSize: 14 },
  cityTxt:   { color: '#3A5568', fontSize: 13, marginTop: 4 },

  section:      { marginHorizontal: SIZES.padding, marginBottom: SIZES.base },
  sectionTitle: { fontSize: 11, color: '#243545', fontWeight: '800', letterSpacing: 2, marginBottom: 10, marginTop: 8 },

  infoRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1825', borderRadius: 14, borderWidth: 1, borderColor: '#162535', padding: 14, marginBottom: 8 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#3A7BD512', borderWidth: 1, borderColor: '#3A7BD525', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoIcon:    { fontSize: 18 },
  infoContent: { flex: 1 },
  infoLabel:   { fontSize: 11, color: '#3A5568', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue:   { fontSize: 15, color: '#C8D8E8', fontWeight: '600' },

  accountCard:    { backgroundColor: '#0B1825', borderRadius: 14, borderWidth: 1, borderColor: '#162535', overflow: 'hidden' },
  accountRow:     { flexDirection: 'row', alignItems: 'center', padding: 16 },
  accountIcon:    { fontSize: 18, marginRight: 14 },
  accountTxt:     { flex: 1, fontSize: 15, color: '#C8D8E8', fontWeight: '600' },
  accountArrow:   { fontSize: 22, color: '#3A5568' },
  accountDivider: { height: 1, backgroundColor: '#162535' },
});

export default ProfileScreen;
