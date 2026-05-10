import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import GradientButton from '../../components/GradientButton';

const WorkerDetailsScreen = ({ navigation, route }) => {
  // Assuming worker is passed via route.params
  const { worker } = route.params || { 
    worker: { name: 'Unknown', category: 'N/A', rating: '0', cnic: 'N/A' } 
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Worker Details</Text>
        <View style={{ width: 50 }} /> {/* Spacer */}
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{worker.name.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{worker.name}</Text>
        <Text style={styles.category}>{worker.category}</Text>
        <Text style={styles.rating}>⭐ {worker.rating}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.infoText}>Experienced professional providing reliable {worker.category.toLowerCase()} services.</Text>
        
        <Text style={styles.sectionTitle}>Services</Text>
        <View style={styles.serviceItem}>
          <Text style={styles.serviceName}>Standard Service</Text>
          <Text style={styles.servicePrice}>Rs. 1500</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <GradientButton 
          title="Book Now" 
          onPress={() => navigation.navigate('Booking', { worker })} 
        />
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={() => navigation.navigate('Chat', { worker })}
        >
          <Text style={styles.chatText}>Send Message</Text>
        </TouchableOpacity>
      </View>
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
  profileSection: { alignItems: 'center', padding: SIZES.extraLarge, backgroundColor: COLORS.card, marginBottom: SIZES.base },
  avatar: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.secondary,
    justifyContent: 'center', alignItems: 'center', marginBottom: SIZES.base,
  },
  avatarText: { fontSize: 40, color: '#FFF', fontWeight: 'bold' },
  name: { ...FONTS.title, color: COLORS.text, marginBottom: 4 },
  category: { ...FONTS.large, color: COLORS.primary, marginBottom: 8 },
  rating: { ...FONTS.body, color: COLORS.warning },
  infoSection: { padding: SIZES.padding, backgroundColor: COLORS.card },
  sectionTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: SIZES.small, marginTop: SIZES.base },
  infoText: { ...FONTS.body, color: COLORS.textSecondary, lineHeight: 22 },
  serviceItem: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SIZES.small,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  serviceName: { ...FONTS.body, color: COLORS.text },
  servicePrice: { ...FONTS.body, color: COLORS.success, fontWeight: 'bold' },
  actions: { padding: SIZES.padding, marginTop: SIZES.extraLarge },
  chatBtn: {
    marginTop: SIZES.base, padding: SIZES.padding, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center',
  },
  chatText: { ...FONTS.large, color: COLORS.primary, fontWeight: 'bold' },
});

export default WorkerDetailsScreen;
