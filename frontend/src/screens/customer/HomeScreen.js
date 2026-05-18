import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import WorkerCard from '../../components/WorkerCard';
import { workerAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const CATEGORIES = [
  { key: 'All',         icon: '🔍' },
  { key: 'Plumber',     icon: '🔧' },
  { key: 'Electrician', icon: '⚡' },
  { key: 'Painter',     icon: '🎨' },
  { key: 'AC Repair',   icon: '❄️' },
  { key: 'Carpenter',   icon: '🪚' },
  { key: 'Mechanic',    icon: '🔩' },
  { key: 'Welder',      icon: '🔥' },
  { key: 'Qasai',       icon: '🥩' },
];

const HomeScreen = ({ navigation }) => {
  const [allWorkers, setAllWorkers]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [userName, setUserName]       = useState('');
  const { updateUserRole }            = useAuth();

  useEffect(() => {
    loadUserName();
    fetchWorkers();
  }, []);

  const loadUserName = async () => {
    const name = await AsyncStorage.getItem('userName');
    if (name) setUserName(name);
  };

  const fetchWorkers = async () => {
    try {
      const data = await workerAPI.getAll();
      setAllWorkers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch workers:', error);
      setAllWorkers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkers();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(['userRole', 'userId', 'userName']);
    await updateUserRole(null);
  };

  // Filter workers by category + search
  const filteredWorkers = allWorkers.filter((w) => {
    const matchesCat    = activeCategory === 'All' || w.category === activeCategory;
    const q             = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      (w.name     && w.name.toLowerCase().includes(q)) ||
      (w.category && w.category.toLowerCase().includes(q)) ||
      (w.city     && w.city.toLowerCase().includes(q));
    return matchesCat && matchesSearch;
  });

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>🔧</Text>
      <Text style={styles.emptyTitle}>No Workers Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || activeCategory !== 'All'
          ? 'Try a different search or category'
          : 'Pull down to refresh'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0A1E32', '#060E18']} style={styles.header}>
        <View>
          <Text style={styles.title}>HunarHub</Text>
          <Text style={styles.headerSub}>
            {userName ? `Welcome, ${userName.split(' ')[0]} 👋` : 'Find skilled workers near you'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.iconBtn}>
            <View style={styles.iconBtnInner}>
              <Text style={styles.iconText}>👤</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search workers, categories, cities..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.catWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catBtn, active && styles.catBtnActive]}
                onPress={() => setActiveCategory(cat.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.catBtnIcon}>{cat.icon}</Text>
                <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>{cat.key}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {activeCategory === 'All' ? 'Available Workers' : activeCategory + 's'}
        </Text>
        {!loading && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{filteredWorkers.length} found</Text>
          </View>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading workers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.workerId?.toString() ?? Math.random().toString()}
          renderItem={({ item }) => (
            <WorkerCard
              worker={item}
              onPress={() => navigation.navigate('WorkerDetails', { worker: item })}
            />
          )}
          contentContainerStyle={[styles.list, filteredWorkers.length === 0 && styles.listEmpty]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.primary}
              colors={[COLORS.primary]}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingTop: SIZES.extraLarge * 2, paddingBottom: SIZES.padding,
    borderBottomWidth: 1, borderBottomColor: '#0C2540',
  },
  title:     { ...FONTS.title, color: COLORS.primary, fontSize: 26 },
  headerSub: { ...FONTS.small, color: COLORS.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: SIZES.base },
  iconBtn:       { },
  iconBtnInner:  {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(0,210,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,210,255,0.25)',
    justifyContent: 'center', alignItems: 'center',
  },
  iconText:  { fontSize: 18 },
  logoutBtn: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(255,76,76,0.4)', backgroundColor: 'rgba(255,76,76,0.1)',
  },
  logoutText: { ...FONTS.small, color: COLORS.error, fontWeight: 'bold' },

  searchWrap: { backgroundColor: COLORS.card, paddingHorizontal: SIZES.padding, paddingVertical: SIZES.small, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SIZES.small,
  },
  searchIcon:  { fontSize: 16, marginRight: 6, color: COLORS.textSecondary },
  searchInput: { flex: 1, ...FONTS.body, color: COLORS.text, paddingVertical: 10 },
  clearBtn:    { fontSize: 14, color: COLORS.textSecondary, paddingHorizontal: 6 },

  catWrap:   { backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  catScroll: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.base, gap: SIZES.base },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  catBtnActive:    { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  catBtnIcon:      { fontSize: 14 },
  catBtnText:      { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  catBtnTextActive:{ color: COLORS.primary, fontWeight: 'bold' },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: SIZES.padding, paddingVertical: SIZES.small,
  },
  sectionTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },
  countBadge:   { backgroundColor: COLORS.primary + '18', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: COLORS.primary + '40' },
  countText:    { ...FONTS.small, color: COLORS.primary, fontWeight: '700' },

  list:      { padding: SIZES.padding, paddingTop: SIZES.base },
  listEmpty: { flex: 1 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.base },
  loadingText:      { ...FONTS.body, color: COLORS.textSecondary, marginTop: SIZES.base },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: SIZES.extraLarge * 3 },
  emptyIcon:      { fontSize: 60, marginBottom: SIZES.padding },
  emptyTitle:     { ...FONTS.large, color: COLORS.text, marginBottom: SIZES.base },
  emptySubtitle:  { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
});

export default HomeScreen;
