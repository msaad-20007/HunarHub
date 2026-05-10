import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';

const BookingScreen = ({ navigation, route }) => {
  const { worker } = route.params || { worker: null };
  const [bookingType, setBookingType] = useState('NORMAL'); // NORMAL, ADVANCE, URGENT

  const handleBooking = async () => {
    try {
      const customerId = await AsyncStorage.getItem('userId');
      if (!customerId) throw new Error("Customer not found. Please log in again.");

      const bookingData = {
        customerId: parseInt(customerId, 10),
        workerId: worker.workerId || worker.id,
        type: bookingType,
      };

      // Real API call
      const response = await fetch('http://10.0.2.2:8080/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Failed to book worker");

      Alert.alert("Success", "Booking created successfully!");
      navigation.navigate('CustomerHome');
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Service</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Select Booking Type</Text>
        <Text style={styles.subtitle}>Choose how soon you need the service</Text>

        <TouchableOpacity 
          style={[styles.typeCard, bookingType === 'NORMAL' && styles.selectedCard]}
          onPress={() => setBookingType('NORMAL')}
        >
          <Text style={[styles.typeTitle, bookingType === 'NORMAL' && styles.selectedText]}>Normal Booking</Text>
          <Text style={[styles.typeDesc, bookingType === 'NORMAL' && styles.selectedText]}>Standard service request</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.typeCard, bookingType === 'ADVANCE' && styles.selectedCard]}
          onPress={() => setBookingType('ADVANCE')}
        >
          <Text style={[styles.typeTitle, bookingType === 'ADVANCE' && styles.selectedText]}>Advance Booking</Text>
          <Text style={[styles.typeDesc, bookingType === 'ADVANCE' && styles.selectedText]}>Schedule for a future date & time</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.typeCard, styles.urgentCard, bookingType === 'URGENT' && styles.selectedUrgentCard]}
          onPress={() => setBookingType('URGENT')}
        >
          <Text style={[styles.typeTitle, styles.urgentText, bookingType === 'URGENT' && styles.selectedUrgentText]}>Urgent Booking 🚨</Text>
          <Text style={[styles.typeDesc, styles.urgentText, bookingType === 'URGENT' && styles.selectedUrgentText]}>Emergency priority service</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <GradientButton title="Confirm Booking" onPress={handleBooking} />
      </View>
    </View>
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
  content: { padding: SIZES.padding, flex: 1 },
  title: { ...FONTS.title, color: COLORS.text, marginBottom: 4 },
  subtitle: { ...FONTS.body, color: COLORS.textSecondary, marginBottom: SIZES.extraLarge },
  typeCard: {
    backgroundColor: COLORS.card, padding: SIZES.padding, borderRadius: SIZES.radius,
    marginBottom: SIZES.base, borderWidth: 2, borderColor: 'transparent',
  },
  selectedCard: { borderColor: COLORS.primary, backgroundColor: 'rgba(0, 210, 255, 0.1)' },
  typeTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  typeDesc: { ...FONTS.small, color: COLORS.textSecondary },
  selectedText: { color: COLORS.primary },
  urgentCard: { borderColor: 'rgba(255, 76, 76, 0.3)' },
  selectedUrgentCard: { borderColor: COLORS.error, backgroundColor: 'rgba(255, 76, 76, 0.1)' },
  urgentText: { color: COLORS.error },
  selectedUrgentText: { color: COLORS.error },
  footer: { padding: SIZES.padding, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
});

export default BookingScreen;
