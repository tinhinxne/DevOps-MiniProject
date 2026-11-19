import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme';

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
};

export function Stepper({ value, min = 1, max = 10, step = 1, unit, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(Math.max(min, value - step))}
        accessibilityRole="button"
        accessibilityLabel="Diminuer">
        <Ionicons name="remove" size={16} color={colors.logoBlue} />
      </Pressable>
      <Text style={styles.value}>{unit ? `${value} ${unit}` : value}</Text>
      <Pressable
        style={styles.btn}
        onPress={() => onChange(Math.min(max, value + step))}
        accessibilityRole="button"
        accessibilityLabel="Augmenter">
        <Ionicons name="add" size={16} color={colors.logoBlue} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#D3E9F8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { minWidth: 28, textAlign: 'center', fontSize: 14, fontWeight: '700', color: '#0F172A' },
});