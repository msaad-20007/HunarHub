import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';

const AdminDashboard = ({ navigation, route }) => {
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const { setUserRole } = route.params || {};

  useEffect(() => {
    // Mock pending workers
    setPendingWorkers([
      { id: 1, name: "Zain", category: "Welder", cnic: "37405-1234567-1" },
      { id: 2, name: "Tariq", category: "Mechanic", cnic: "37405-9876543-1" }
    ]);
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userId');
    if (setUserRole) setUserRole(null);
  };

  const renderWorker = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.details}>Category: {item.category}</Text>
      <Text style={styles.details}>CNIC: {item.cnic}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnApprove} onPress={() => Alert.alert("Approved", `${item.name} is now approved.`)}>
          <Text style={styles.btnText}>Approve</Text>
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
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>Pending Worker Approvals</Text>

      <FlatList
        data={pendingWorkers}
        keyExtractor={item => item.id.toString()}
        renderItem={renderWorker}
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
  card: {
    backgroundColor: COLORS.card, borderRadius: SIZES.radius, padding: SIZES.padding,
    marginBottom: SIZES.base, borderWidth: 1, borderColor: COLORS.border,
  },
  name: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: 4 },
  details: { ...FONTS.body, color: COLORS.textSecondary, marginBottom: 2 },
  actions: { flexDirection: 'row', justifyContent: 'flex-start', marginTop: SIZES.base },
  btnApprove: { backgroundColor: COLORS.success, paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radius, marginRight: 10 },
  btnReject: { backgroundColor: COLORS.error, paddingHorizontal: 20, paddingVertical: 8, borderRadius: SIZES.radius },
  btnText: { color: '#FFF', fontWeight: 'bold' }
});

export default AdminDashboard;
