import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS } from '../theme/Theme';

const CATEGORY_ICONS = {
  'Plumber': '🔧',
  'Electrician': '⚡',
  'Painter': '🎨',
  'AC Repair': '❄️',
  'Carpenter': '🪚',
  'Mechanic': '🔩',
  'Welder': '🔥',
  'Qasai': '🥩',
};

const WorkerCard = ({ worker, onPress }) => {
  const icon = CATEGORY_ICONS[worker.category] || '👷';
  const initials = worker.name
    ? worker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'W';

  const renderStars = (rating) => {
    if (!rating) return null;
    const full = Math.floor(rating);
    const stars = '★'.repeat(full) + '☆'.repeat(5 - full);
    return stars;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.name}>{worker.name}</Text>
        <View style={styles.categoryRow}>
          <Text style={styles.categoryIcon}>{icon}</Text>
          <Text style={styles.category}>{worker.category}</Text>
        </View>
        {worker.city && (
          <Text style={styles.city}>📍 {worker.city}</Text>
        )}
      </View>

      {/* Right side */}
      <View style={styles.right}>
        {worker.rating ? (
          <>
            <Text style={styles.ratingNumber}>{Number(worker.rating).toFixed(1)}</Text>
            <Text style={styles.stars}>{renderStars(worker.rating)}</Text>
          </>
        ) : (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>NEW</Text>
          </View>
        )}
        {worker.approvalStatus === 'PENDING' && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginVertical: SIZES.base / 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SIZES.small,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  info: {
    flex: 1,
  },
  name: {
    ...FONTS.large,
    color: COLORS.text,
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  categoryIcon: {
    fontSize: 13,
    marginRight: 4,
  },
  category: {
    ...FONTS.body,
    color: COLORS.primary,
  },
  city: {
    ...FONTS.small,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  right: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: 50,
  },
  ratingNumber: {
    ...FONTS.large,
    color: COLORS.warning,
    fontWeight: 'bold',
  },
  stars: {
    color: COLORS.warning,
    fontSize: 11,
    marginTop: 2,
  },
  newBadge: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  newBadgeText: {
    ...FONTS.small,
    color: COLORS.success,
    fontWeight: 'bold',
    fontSize: 10,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  pendingText: {
    fontSize: 9,
    color: COLORS.warning,
    fontWeight: 'bold',
  },
});

export default WorkerCard;
