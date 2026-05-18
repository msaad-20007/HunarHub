import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, FlatList,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import WorkerCard from '../../components/WorkerCard';
import { workerAPI } from '../../services/api';

const FILTERS = [
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

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery]   = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [allWorkers, setAllWorkers]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    try {
      const data = await workerAPI.getAll();
      setAllWorkers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Search fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchWorkers();
  }, []);

  const filteredWorkers = allWorkers.filter((worker) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !q ||
      (worker.name     && worker.name.toLowerCase().includes(q)) ||
      (worker.category && worker.category.toLowerCase().includes(q)) ||
      (worker.city     && worker.city.toLowerCase().includes(q));
    const matchesFilter = activeFilter === 'All' || worker.category === activeFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0A1E32', '#060E18']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Workers</Text>
        <View style={{ width: 60 }} />
      </LinearGradient>

      {/* Search input */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Name, category, city..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category filters */}
      <View style={styles.filterWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={FILTERS}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.filterScroll}
          renderItem={({ item }) => {
            const active = activeFilter === item.key;
            return (
              <TouchableOpacity
                style={[styles.filterBtn, active && styles.filterBtnActive]}
                onPress={() => setActiveFilter(item.key)}
                activeOpacity={0.8}
              >
                <Text style={styles.filterIcon}>{item.icon}</Text>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.key}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Results count */}
      {!loading && (
        <View style={styles.resultsRow}>
          <Text style={styles.resultsText}>
            {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
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
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>No workers found</Text>
              <Text style={styles.emptySubtitle}>Try a different search term or category</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding, paddingTop: SIZES.extraLarge * 2, paddingBottom: SIZES.padding,
    borderBottomWidth: 1, borderBottomColor: '#0C2540',
  },
  backBtn:     { padding: SIZES.small },
  backText:    { ...FONTS.body, color: COLORS.primary, fontSize: 18 },
  headerTitle: { ...FONTS.large, color: COLORS.text, fontWeight: 'bold' },

  searchWrap: {
    backgroundColor: COLORS.card, paddingHorizontal: SIZES.padding,
    paddingVertical: SIZES.small, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.background, borderRadius: SIZES.radius,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SIZES.small,
  },
  searchIcon:  { fontSize: 16, marginRight: 6, color: COLORS.textSecondary },
  searchInput: { flex: 1, ...FONTS.body, color: COLORS.text, paddingVertical: 10 },
  clearBtn:    { fontSize: 14, color: COLORS.textSecondary, paddingHorizontal: 6 },

  filterWrap:   { backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterScroll: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.base, gap: SIZES.base },
  filterBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background,
  },
  filterBtnActive:  { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  filterIcon:       { fontSize: 14 },
  filterText:       { ...FONTS.small, color: COLORS.textSecondary, fontWeight: '600' },
  filterTextActive: { color: COLORS.primary, fontWeight: 'bold' },

  resultsRow: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.base },
  resultsText: { ...FONTS.small, color: COLORS.textSecondary },

  list:        { padding: SIZES.padding, paddingTop: SIZES.base },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SIZES.base },
  loadingText: { ...FONTS.body, color: COLORS.textSecondary, marginTop: SIZES.base },

  emptyWrap:     { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: SIZES.extraLarge * 3 },
  emptyIcon:     { fontSize: 52, marginBottom: SIZES.small },
  emptyTitle:    { ...FONTS.large, color: COLORS.text, fontWeight: 'bold', marginBottom: 6 },
  emptySubtitle: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center' },
});

export default SearchScreen;
