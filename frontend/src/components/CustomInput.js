import React from 'react';
import { View, TextInput, StyleSheet, Text } from 'react-native';
import { COLORS, SIZES, FONTS } from '../theme/Theme';

const CustomInput = ({ label, placeholder, secureTextEntry, value, onChangeText, keyboardType }) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textSecondary}
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
      />
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
  input: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    padding: SIZES.small,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...FONTS.body,
  },
});

export default CustomInput;
