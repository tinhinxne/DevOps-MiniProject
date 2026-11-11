// import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
// import { colors, radius, spacing, fontSize } from '../theme';

// export function Input({ label, ...props }: TextInputProps & { label?: string }) {
//   return (
//     <View style={styles.wrapper}>
//       {label ? <Text style={styles.label}>{label}</Text> : null}
//       <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   wrapper: { gap: spacing.xs },
//   label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
//   input: {
//     backgroundColor: colors.card,
//     borderWidth: 1,
//     borderColor: colors.border,
//     borderRadius: radius.md,
//     padding: spacing.md,
//     fontSize: fontSize.md,
//     color: colors.text,
//   },
// });


import { ReactNode } from 'react';
import { View, Text, TextInput, TextInputProps, StyleSheet } from 'react-native';
import { colors, radius, spacing, fontSize } from '../theme';

// type Props = TextInputProps & {
//   label?: string;
//   leftIcon?: ReactNode;
//   rightIcon?: ReactNode;
// };

// export function Input({ label, leftIcon, rightIcon, ...props }: Props) {
//   return (
//     <View style={styles.wrapper}>
//       {label ? <Text style={styles.label}>{label}</Text> : null}
//       <View style={styles.field}>
//         {leftIcon}
//         <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
//         {rightIcon}
//       </View>
//     </View>
//   );
// }
type Props = TextInputProps & {
  label?: string;
  labelColor?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function Input({ label, labelColor, leftIcon, rightIcon, ...props }: Props) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>{label}</Text>
      ) : null}
      <View style={styles.field}>
        {leftIcon}
        <TextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />
        {rightIcon}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
  },
});