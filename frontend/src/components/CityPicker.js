import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { COLORS, SIZES, FONTS } from '../theme/Theme';

const CITIES = [
  "Rawalpindi", "Islamabad", "Lahore", "Karachi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot",
  "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Sukkur",
  "Wah Cantt", "Jhelum", "Gujrat", "Mardan", "Dera Ghazi Khan"
];

// Custom picker to avoid Android white dropdown bug with @react-native-picker/picker
const CityPicker = ({ selectedValue, onValueChange }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select City</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.selectedText}>{selectedValue || 'Select a city'}</Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Select City</Text>
            <FlatList
              data={CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item === selectedValue && styles.optionSelected]}
                  onPress={() => {
                    onValueChange(item);
                    setModalVisible(false);
                  }}
                >
                  <Text style={[styles.optionText, item === selectedValue && styles.optionTextSelected]}>
                    {item}
                  </Text>
                  {item === selectedValue && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SIZES.base,
  },
  label: {
    ...FONTS.body,
    marginBottom: SIZES.base / 2,
    color: COLORS.text,
  },
  selector: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SIZES.small,
    paddingVertical: SIZES.small + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  arrow: {
    color: COLORS.primary,
    fontSize: 16,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    width: '80%',
    maxHeight: '60%',
    paddingVertical: SIZES.base,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalTitle: {
    ...FONTS.large,
    color: COLORS.primary,
    textAlign: 'center',
    paddingVertical: SIZES.small,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: SIZES.base,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SIZES.small,
    paddingHorizontal: SIZES.padding,
  },
  optionSelected: {
    backgroundColor: 'rgba(0, 210, 255, 0.1)',
  },
  optionText: {
    ...FONTS.body,
    color: COLORS.text,
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  checkmark: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CityPicker;
