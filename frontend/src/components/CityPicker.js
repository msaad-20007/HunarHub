import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // We need to install this
import { COLORS, SIZES, FONTS } from '../theme/Theme';

const CITIES = [
  "Rawalpindi", "Islamabad", "Lahore", "Karachi", "Faisalabad",
  "Multan", "Peshawar", "Quetta", "Gujranwala", "Sialkot",
  "Hyderabad", "Bahawalpur", "Sargodha", "Abbottabad", "Sukkur",
  "Wah Cantt", "Jhelum", "Gujrat", "Mardan", "Dera Ghazi Khan"
];

const CityPicker = ({ selectedValue, onValueChange }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select City</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={COLORS.primary}
        >
          {CITIES.map((city, index) => (
            <Picker.Item label={city} value={city} key={index} color={COLORS.text} />
          ))}
        </Picker>
      </View>
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
  },
  pickerContainer: {
    backgroundColor: COLORS.card,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  picker: {
    color: COLORS.text,
    backgroundColor: COLORS.card,
  },
});

export default CityPicker;
