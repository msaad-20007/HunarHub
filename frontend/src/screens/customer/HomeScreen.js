import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import WorkerCard from '../../components/WorkerCard';
import { workerAPI } from '../../services/api';

const HomeScreen = ({ navigation, route }) => {
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setUserRole } = route.params || {}; // Fallback

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      // Mock data for UI presentation if backend isn't running
      const mockWorkers = [
        { workerId: 1, name: "Ali Khan", category: "Plumber", rating: 4.8 },
        { workerId: 2, name: "Usman", category: "Electrician", rating: 4.5 },
      ];
      setWorkers(mockWorkers);
      setLoading(false);
      
      // Real API call (uncomment when backend is ready)
      // const data = await workerAPI.getAll();
      // setWorkers(data);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('userId');
    if (setUserRole) {
      setUserRole(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>HunarHub</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Search')} style={styles.actionBtn}>
            <Text style={styles.actionText}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.actionBtn}>
            <Text style={styles.actionText}>👤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <Text style={styles.subtitle}>Find local experts for your needs</Text>

      <FlatList
        data={workers}
        keyExtractor={(item) => item.workerId.toString()}
        renderItem={({ item }) => (
          <WorkerCard 
            worker={item} 
            onPress={() => navigation.navigate('WorkerDetails', { worker: item })} 
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.padding,
    paddingTop: SIZES.extraLarge * 2,
    backgroundColor: COLORS.card,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    marginRight: SIZES.base,
    padding: SIZES.base,
  },
  actionText: {
    fontSize: 18,
  },
  title: {
    ...FONTS.title,
    color: COLORS.primary,
    fontSize: 24, // Slightly smaller than default title for header
  },
  logoutBtn: {
    padding: SIZES.small,
  },
  logoutText: {
    ...FONTS.body,
    color: COLORS.error,
    fontWeight: 'bold',
  },
  subtitle: {
    ...FONTS.large,
    color: COLORS.textSecondary,
    paddingHorizontal: SIZES.padding,
    marginVertical: SIZES.base,
  },
  list: {
    padding: SIZES.padding,
  },
});

export default HomeScreen;
