import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';

const WorkerDashboard = ({ navigation, route }) => {
  const [requests, setRequests] = useState([]);
  const { setUserRole } = route.params || {};

  useEffect(() => {
    // Mock booking requests
    setRequests([
      { id: 1, customer: "Ahmad", type: "URGENT", date: "Today", service: "Water leakage fix" },
      { id: 2, customer: "Sara", type: "ADVANCE", date: "Tomorrow", service: "Pipe installation" }
    ]);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userId');
    if (setUserRole) setUserRole(null);
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestCard}>
      <View style={styles.row}>
        <Text style={styles.customerName}>{item.customer}</Text>
        <Text style={[styles.type, item.type === 'URGENT' ? styles.urgent : styles.normal]}>
          {item.type}
        </Text>
      </View>
      <Text style={styles.serviceText}>{item.service}</Text>
      <Text style={styles.dateText}>Date: {item.date}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnAccept}>
          <Text style={styles.btnText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnReject}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Worker Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Recent Service Requests</Text>

      <FlatList
        data={requests}
        keyExtractor={item => item.id.toString()}
        renderItem={renderRequest}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: SIZES.padding, paddingTop: SIZES.extraLarge * 2, backgroundColor: COLORS.card,
  },
  title: { ...FONTS.title, color: COLORS.primary, fontSize: 24 },
  logoutBtn: { padding: SIZES.small },
  logoutText: { ...FONTS.body, color: COLORS.error, fontWeight: 'bold' },
  subtitle: { ...FONTS.large, color: COLORS.textSecondary, paddingHorizontal: SIZES.padding, marginVertical: SIZES.base },
  list: { padding: SIZES.padding },
  requestCard: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: SIZES.padding,
    marginBottom: SIZES.base, borderWidth: 1, borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SIZES.base / 2 },
  customerName: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  type: { ...FONTS.small, fontWeight: 'bold', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  urgent: { backgroundColor: 'rgba(255, 76, 76, 0.2)', color: COLORS.error },
  normal: { backgroundColor: 'rgba(58, 123, 213, 0.2)', color: COLORS.secondary },
  serviceText: { ...FONTS.body, color: COLORS.textSecondary, marginBottom: 4 },
  dateText: { ...FONTS.small, color: COLORS.textSecondary, marginBottom: SIZES.base },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: SIZES.base },
  btnAccept: { backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radius, marginLeft: 10 },
  btnReject: { backgroundColor: COLORS.error, paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radius, marginLeft: 10 },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});

export default WorkerDashboard;
