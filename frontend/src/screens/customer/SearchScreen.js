import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../../theme/Theme';
import WorkerCard from '../../components/WorkerCard';

const SearchScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filters = ['All', 'Plumber', 'Electrician', 'Painter', 'Mechanic'];

  // Mock data
  const allWorkers = [
    { workerId: 1, name: "Ali Khan", category: "Plumber", rating: 4.8 },
    { workerId: 2, name: "Usman", category: "Electrician", rating: 4.5 },
    { workerId: 3, name: "Hamza", category: "Painter", rating: 4.2 },
    { workerId: 4, name: "Bilal", category: "Mechanic", rating: 4.9 },
  ];

  const filteredWorkers = allWorkers.filter(worker => {
    const matchesQuery = worker.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         worker.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || worker.category === activeFilter;
    return matchesQuery && matchesFilter;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>{'< Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search workers, categories..."
          placeholderTextColor={COLORS.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.filterBtn, activeFilter === item && styles.activeFilterBtn]}
              onPress={() => setActiveFilter(item)}
            >
              <Text style={[styles.filterText, activeFilter === item && styles.activeFilterText]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <FlatList
        data={filteredWorkers}
        keyExtractor={item => item.workerId.toString()}
        renderItem={({ item }) => (
          <WorkerCard 
            worker={item} 
            onPress={() => navigation.navigate('WorkerDetails', { worker: item })} 
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No workers found.</Text>}
      />
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
  searchContainer: { padding: SIZES.padding, backgroundColor: COLORS.card },
  searchInput: {
    backgroundColor: COLORS.background, color: COLORS.text, padding: SIZES.padding,
    borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, ...FONTS.body
  },
  filterContainer: { paddingVertical: SIZES.base, paddingHorizontal: SIZES.padding, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: SIZES.base },
  activeFilterBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { ...FONTS.body, color: COLORS.textSecondary },
  activeFilterText: { color: '#FFF', fontWeight: 'bold' },
  list: { padding: SIZES.padding },
  emptyText: { ...FONTS.body, color: COLORS.textSecondary, textAlign: 'center', marginTop: SIZES.extraLarge },
});

export default SearchScreen;
