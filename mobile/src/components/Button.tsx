// import { Pressable, Text, StyleSheet } from 'react-native';
// import { colors, radius, spacing, fontSize } from '../theme';

// type Props = {
//   title: string;
//   onPress: () => void;
//   variant?: 'primary' | 'secondary';
//   disabled?: boolean;
// };

// export function Button({ title, onPress, variant = 'primary', disabled }: Props) {
//   const primary = variant === 'primary';
//   return (
//     <Pressable
//       onPress={onPress}
//       disabled={disabled}
//       style={[styles.base, primary ? styles.primary : styles.secondary, disabled && styles.disabled]}
//     >
//       <Text style={[styles.text, !primary && styles.textSecondary]}>{title}</Text>
//     </Pressable>
//   );
// }

// const styles = StyleSheet.create({
//   base: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
//   primary: { backgroundColor: colors.patient },
//   secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.patient },
//   disabled: { opacity: 0.5 },
//   text: { color: '#fff', fontSize: fontSize.md, fontWeight: '600' },
//   textSecondary: { color: colors.patient },
// });


import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, radius, spacing } from '../theme';

type Variant = 'primary' | 'secondary' | 'brand' | 'light';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  rightIcon?: ReactNode;
  disabled?: boolean;
};

export function Button({ title, onPress, variant = 'primary', rightIcon, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.base, containerStyles[variant], disabled && styles.disabled]}
    >
      <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
      {rightIcon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  primary: { backgroundColor: colors.patient },
  secondary: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.patient },
  brand: {
    backgroundColor: colors.brand,
    shadowColor: colors.brand,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  light: {
    backgroundColor: colors.card,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  disabled: { opacity: 0.5 },
  text: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
  textSecondary: { color: colors.patient },
  textDark: { color: colors.text },
});

const containerStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  brand: styles.brand,
  light: styles.light,
};

const textStyles = {
  primary: undefined,
  secondary: styles.textSecondary,
  brand: undefined,
  light: styles.textDark,
};