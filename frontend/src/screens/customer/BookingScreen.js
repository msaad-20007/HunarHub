import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';
import { bookingAPI } from '../../services/api';

const BOOKING_TYPES = [
  {
    key: 'NORMAL',
    icon: '📅',
    title: 'Normal Booking',
    desc: 'Standard service request at your convenience',
    color: COLORS.primary,
  },
  {
    key: 'ADVANCE',
    icon: '🗓️',
    title: 'Advance Booking',
    desc: 'Schedule for a specific future date & time',
    color: COLORS.secondary,
  },
  {
    key: 'URGENT',
    icon: '🚨',
    title: 'Urgent Booking',
    desc: 'Emergency priority — worker notified immediately',
    color: COLORS.error,
  },
];

// Simple date/time picker rows (no native module needed)
const DateTimePicker = ({ date, onDateChange, time, onTimeChange }) => {
  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return d;
  });
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8am–7pm

  return (
    <View style={dt.wrap}>
      <Text style={dt.label}>Select Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dt.scroll}>
        {days.map((d, i) => {
          const iso = d.toISOString().slice(0, 10);
          const active = date === iso;
          return (
            <TouchableOpacity
              key={i}
              style={[dt.dayBtn, active && dt.dayBtnActive]}
              onPress={() => onDateChange(iso)}
              activeOpacity={0.8}
            >
              <Text style={[dt.dayName, active && dt.dayNameActive]}>
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </Text>
              <Text style={[dt.dayNum, active && dt.dayNumActive]}>
                {d.getDate()}
              </Text>
              <Text style={[dt.dayMon, active && dt.dayMonActive]}>
                {d.toLocaleDateString('en-US', { month: 'short' })}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Text style={[dt.label, { marginTop: 16 }]}>Select Time</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dt.scroll}>
        {hours.map((h) => {
          const label = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
          const val   = `${String(h).padStart(2, '0')}:00`;
          const active = time === val;
          return (
            <TouchableOpacity
              key={h}
              style={[dt.timeBtn, active && dt.timeBtnActive]}
              onPress={() => onTimeChange(val)}
              activeOpacity={0.8}
            >
              <Text style={[dt.timeLabel, active && dt.timeLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const BookingScreen = ({ navigation, route }) => {
  const { worker } = route.params || {};
  const [bookingType, setBookingType] = useState('NORMAL');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (bookingType === 'ADVANCE' && (!selectedDate || !selectedTime)) {
      Alert.alert('Missing Info', 'Please select a date and time for advance booking.');
      return;
    }

    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) throw new Error('Please log in again.');

      const bookingData = {
        customerId: parseInt(userId, 10),
        workerId:   worker?.workerId || worker?.id,
        type:       bookingType,
        scheduledAt: bookingType === 'ADVANCE' ? `${selectedDate} ${selectedTime}:00` : null,
      };

      await bookingAPI.create(bookingData);

      Alert.alert(
        '✅ Booking Confirmed',
        bookingType === 'ADVANCE'
          ? `Your advance booking for ${selectedDate} at ${selectedTime} has been sent to ${worker?.name}.`
          : `Your ${bookingType.toLowerCase()} booking has been sent to ${worker?.name}. They will respond shortly.`,
        [{ text: 'OK', onPress: () => navigation.navigate('CustomerHome') }]
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1C1812', '#2A2018']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Worker summary */}
        {worker && (
          <View style={styles.workerBanner}>
            <LinearGradient colors={['#F5A62325', '#E8621A20']} style={styles.workerAvatar}>
              <Text style={styles.workerAvatarText}>
                {worker.name?.charAt(0).toUpperCase() || 'W'}
              </Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <Text style={styles.workerCat}>{worker.category}</Text>
              {worker.city ? <Text style={styles.workerCity}>📍 {worker.city}</Text> : null}
            </View>
            {worker.rating > 0 && (
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>⭐ {Number(worker.rating).toFixed(1)}</Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Select Booking Type</Text>

        {BOOKING_TYPES.map((type) => {
          const active = bookingType === type.key;
          return (
            <TouchableOpacity
              key={type.key}
              style={[styles.typeCard, active && { borderColor: type.color, backgroundColor: type.color + '12' }]}
              onPress={() => setBookingType(type.key)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={active ? [type.color + '18', 'transparent'] : ['transparent', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={[styles.typeIconWrap, { backgroundColor: type.color + '18', borderColor: type.color + '40' }]}>
                <Text style={styles.typeIcon}>{type.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.typeTitle, active && { color: type.color }]}>{type.title}</Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
              </View>
              <View style={[styles.radioOuter, active && { borderColor: type.color }]}>
                {active && <View style={[styles.radioInner, { backgroundColor: type.color }]} />}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Date/time picker for ADVANCE */}
        {bookingType === 'ADVANCE' && (
          <DateTimePicker
            date={selectedDate}
            onDateChange={setSelectedDate}
            time={selectedTime}
            onTimeChange={setSelectedTime}
          />
        )}

        {/* Urgent notice */}
        {bookingType === 'URGENT' && (
          <View style={styles.urgentNotice}>
            <Text style={styles.urgentNoticeText}>
              🚨 Urgent bookings are prioritized. The worker will be notified immediately via email.
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Sending booking request...</Text>
          </View>
        ) : (
          <GradientButton title="Confirm Booking" onPress={handleBooking} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingTop: SIZES.extraLarge * 2, paddingBottom: SIZES.padding,
    borderBottomWidth: 1, borderBottomColor: '#2A2018',
  },
  backBtn:     { padding: SIZES.small },
  backText:    { ...FONTS.body, color: COLORS.primary, fontSize: 18 },
  headerTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },

  scroll: { padding: SIZES.padding },

  workerBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: SIZES.radius + 4,
    padding: SIZES.padding, marginBottom: SIZES.padding,
    borderWidth: 1, borderColor: COLORS.border,
  },
  workerAvatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    marginRight: SIZES.small, borderWidth: 1.5, borderColor: '#F5A62330',
  },
  workerAvatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  workerName:       { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  workerCat:        { ...FONTS.body, color: COLORS.primary, marginTop: 2 },
  workerCity:       { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  ratingBadge: {
    backgroundColor: 'rgba(255,193,7,0.15)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(255,193,7,0.4)',
  },
  ratingText: { color: COLORS.warning, fontWeight: 'bold', fontSize: 13 },

  sectionTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: SIZES.small },

  typeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: SIZES.radius + 4,
    padding: SIZES.padding, marginBottom: SIZES.small,
    borderWidth: 1.5, borderColor: COLORS.border, overflow: 'hidden',
  },
  typeIconWrap: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center', marginRight: SIZES.small,
  },
  typeIcon:  { fontSize: 22 },
  typeTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: 2 },
  typeDesc:  { ...FONTS.small, color: COLORS.textSecondary },
  radioOuter: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center',
  },
  radioInner: { width: 10, height: 10, borderRadius: 5 },

  urgentNotice: {
    backgroundColor: 'rgba(255,76,76,0.1)', borderRadius: SIZES.radius,
    padding: SIZES.padding, marginTop: SIZES.small,
    borderWidth: 1, borderColor: 'rgba(255,76,76,0.3)',
  },
  urgentNoticeText: { ...FONTS.body, color: COLORS.error, lineHeight: 22 },

  footer: {
    padding: SIZES.padding, backgroundColor: COLORS.card,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14 },
  loadingText: { ...FONTS.body, color: COLORS.textSecondary },
});

// DateTimePicker styles
const dt = StyleSheet.create({
  wrap:  { backgroundColor: COLORS.card, borderRadius: SIZES.radius + 4, padding: SIZES.padding, marginTop: SIZES.small, borderWidth: 1, borderColor: COLORS.border },
  label: { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '600', marginBottom: SIZES.base },
  scroll: { marginHorizontal: -4 },
  dayBtn: {
    alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background, marginHorizontal: 4,
  },
  dayBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  dayName:      { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
  dayNameActive:{ color: COLORS.primary },
  dayNum:       { fontSize: 20, fontWeight: '800', color: COLORS.text, marginVertical: 2 },
  dayNumActive: { color: COLORS.primary },
  dayMon:       { fontSize: 11, color: COLORS.textSecondary },
  dayMonActive: { color: COLORS.primary },
  timeBtn: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 12, borderWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background, marginHorizontal: 4,
  },
  timeBtnActive:  { backgroundColor: COLORS.secondary + '20', borderColor: COLORS.secondary },
  timeLabel:      { ...FONTS.body, color: COLORS.textSecondary, fontWeight: '600' },
  timeLabelActive:{ color: COLORS.secondary },
});

export default BookingScreen;
