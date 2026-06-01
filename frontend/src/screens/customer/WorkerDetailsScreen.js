import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Animated, Dimensions, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';

const { width } = Dimensions.get('window');

const CAT_ICONS = {
  Plumber: 'build-outline', Electrician: 'flash-outline', Painter: 'color-palette-outline',
  'AC Repair': 'snow-outline', Carpenter: 'hammer-outline', Mechanic: 'settings-outline',
  Welder: 'flame-outline', Qasai: 'restaurant-outline',
};

const InfoRow = ({ iconName, label, value }) => (
  <View style={s.infoRow}>
    <View style={s.infoIconBox}>
      <Ionicons name={iconName} size={20} color="#F5A623" />
    </View>
    <View style={s.infoContent}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const WorkerDetailsScreen = ({ navigation, route }) => {
  const { worker } = route.params || {};
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideY   = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideY,   { toValue: 0, useNativeDriver: true, tension: 80, friction: 8 }),
    ]).start();
  }, []);

  if (!worker) {
    return (
      <View style={s.center}>
        <Text style={s.errorTxt}>Worker data not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtnAlt}>
          <Text style={s.backBtnAltTxt}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials   = worker.name ? worker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : 'W';
  const catIcon    = CAT_ICONS[worker.category] || 'construct-outline';
  const rating     = worker.rating ? Number(worker.rating) : 0;
  const isApproved = worker.approvalStatus === 'APPROVED';

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideY }] }}>

          {/* Hero */}
          <LinearGradient colors={['#1C1812', '#2A2018']} style={s.hero}>
            <LinearGradient colors={['#F5A62315', 'transparent']} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={['#F5A623', '#E8621A']} style={s.avatar}>
              <Text style={s.avatarTxt}>{initials}</Text>
            </LinearGradient>
            <Text style={s.name}>{worker.name}</Text>

            {/* Category badge */}
            <View style={s.catBadge}>
              <Ionicons name={catIcon} size={16} color="#F5A623" style={{ marginRight: 6 }} />
              <Text style={s.catTxt}>{worker.category}</Text>
            </View>

            {/* Rating */}
            {rating > 0 ? (
              <View style={s.ratingRow}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name={i <= Math.floor(rating) ? 'star' : 'star-outline'} size={18} color="#FFC107" />
                ))}
                <Text style={s.ratingNum}>{rating.toFixed(1)}</Text>
              </View>
            ) : (
              <View style={s.newBadge}><Text style={s.newBadgeTxt}>NEW WORKER</Text></View>
            )}

            {/* Status */}
            {worker.approvalStatus && (
              <View style={[s.statusBadge, {
                backgroundColor: isApproved ? '#00E67618' : '#FFC10718',
                borderColor:     isApproved ? '#00E67650' : '#FFC10750',
              }]}>
                <Ionicons
                  name={isApproved ? 'shield-checkmark-outline' : 'time-outline'}
                  size={13} color={isApproved ? '#00E676' : '#FFC107'}
                  style={{ marginRight: 5 }}
                />
                <Text style={[s.statusTxt, { color: isApproved ? '#00E676' : '#FFC107' }]}>
                  {isApproved ? 'Verified Worker' : 'Pending Approval'}
                </Text>
              </View>
            )}

            {worker.city ? (
              <View style={s.cityRow}>
                <Ionicons name="location-outline" size={13} color="#6B5D4F" style={{ marginRight: 4 }} />
                <Text style={s.cityTxt}>{worker.city}</Text>
              </View>
            ) : null}
          </LinearGradient>

          {/* Contact Info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>CONTACT INFO</Text>
            <InfoRow iconName="call-outline"       label="Phone"    value={worker.phone} />
            <InfoRow iconName="logo-whatsapp"      label="WhatsApp" value={worker.whatsapp} />
            <InfoRow iconName="mail-outline"       label="Email"    value={worker.email} />
          </View>

          {/* Professional Info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>PROFESSIONAL INFO</Text>
            <InfoRow iconName={catIcon}            label="Category" value={worker.category} />
            <InfoRow iconName="card-outline"       label="CNIC"     value={worker.cnic} />
            <InfoRow iconName="map-outline"        label="City"     value={worker.city} />
          </View>

          {/* About */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>ABOUT</Text>
            <View style={s.aboutCard}>
              <Text style={s.aboutTxt}>
                {worker.name} is an experienced {worker.category?.toLowerCase()} professional
                {worker.city ? ` based in ${worker.city}` : ''}.
                {isApproved ? ' Verified and approved by HunarHub.' : ' Currently pending verification.'}
              </Text>
            </View>
          </View>

          {/* Services */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>SERVICES</Text>
            <View style={s.serviceCard}>
              <View style={s.serviceRow}>
                <Text style={s.serviceName}>Standard Service</Text>
                <Text style={s.servicePrice}>Rs. 1,500</Text>
              </View>
              <View style={s.serviceRow}>
                <Text style={s.serviceName}>Emergency / Urgent</Text>
                <Text style={[s.servicePrice, { color: '#FF4C4C' }]}>Rs. 2,500</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={s.actions}>
            <GradientButton title="Book Now" onPress={() => navigation.navigate('Booking', { worker })} style={{ marginBottom: SIZES.base }} />
            <TouchableOpacity style={s.chatBtn} onPress={() => navigation.navigate('Chat', { worker })} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={18} color="#F5A623" style={{ marginRight: 8 }} />
              <Text style={s.chatTxt}>Send Message</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0F0D0A' },
  center: { flex: 1, backgroundColor: '#0F0D0A', justifyContent: 'center', alignItems: 'center' },
  errorTxt: { color: '#8A7D6B', fontSize: 16, marginBottom: 16 },
  backBtnAlt: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#F5A62340' },
  backBtnAltTxt: { color: '#F5A623', fontWeight: '700' },
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
    shadowColor: '#F5A623', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 12,
  },
  avatarTxt: { fontSize: 34, fontWeight: '900', color: '#FFF' },
  name: { fontSize: 24, fontWeight: '800', color: '#F5EFE6', marginBottom: 10 },
  catBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5A62315', borderRadius: 20, borderWidth: 1, borderColor: '#F5A62330', paddingHorizontal: 14, paddingVertical: 6, marginBottom: 10 },
  catTxt: { color: '#F5A623', fontWeight: '700', fontSize: 14 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 2 },
  ratingNum: { color: '#FFC107', fontWeight: '800', fontSize: 16, marginLeft: 6 },
  newBadge: { backgroundColor: '#00E67615', borderRadius: 10, borderWidth: 1, borderColor: '#00E67640', paddingHorizontal: 12, paddingVertical: 4, marginBottom: 10 },
  newBadgeTxt: { color: '#00E676', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 8 },
  statusTxt: { fontSize: 13, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  cityTxt: { color: '#6B5D4F', fontSize: 13 },
  section: { marginHorizontal: SIZES.padding, marginBottom: SIZES.base },
  sectionTitle: { fontSize: 11, color: '#4A3D30', fontWeight: '800', letterSpacing: 2, marginBottom: 10, marginTop: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1812', borderRadius: 14, borderWidth: 1, borderColor: '#2E2820', padding: 14, marginBottom: 8 },
  infoIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5A62312', borderWidth: 1, borderColor: '#F5A62325', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6B5D4F', fontWeight: '600', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 15, color: '#F5EFE6', fontWeight: '600' },
  aboutCard: { backgroundColor: '#1C1812', borderRadius: 14, borderWidth: 1, borderColor: '#2E2820', padding: 16 },
  aboutTxt: { fontSize: 14, color: '#8A7D6B', lineHeight: 22 },
  serviceCard: { backgroundColor: '#1C1812', borderRadius: 14, borderWidth: 1, borderColor: '#2E2820', overflow: 'hidden' },
  serviceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2E2820' },
  serviceName: { fontSize: 14, color: '#F5EFE6', fontWeight: '600' },
  servicePrice: { fontSize: 15, color: '#00E676', fontWeight: '800' },
  actions: { marginHorizontal: SIZES.padding, marginTop: SIZES.base },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#F5A62340', borderRadius: SIZES.radius,
    padding: SIZES.padding, backgroundColor: '#F5A62308',
  },
  chatTxt: { color: '#F5A623', fontWeight: '700', fontSize: 16 },
});

export default WorkerDetailsScreen;
