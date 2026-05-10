import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { COLORS, SIZES, FONTS } from '../theme/Theme';

const WorkerCard = ({ worker, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.row}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{worker.name ? worker.name.charAt(0) : 'W'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.category}>{worker.category}</Text>
          <Text style={styles.rating}>⭐ {worker.rating || "New"}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginVertical: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.padding,
  },
  avatarText: {
    ...FONTS.title,
    color: '#FFF',
  },
  info: {
    flex: 1,
  },
  name: {
    ...FONTS.large,
  },
  category: {
    ...FONTS.body,
    color: COLORS.primary,
    marginTop: 2,
  },
  rating: {
    ...FONTS.small,
    color: COLORS.warning,
    marginTop: 4,
  },
});

export default WorkerCard;
