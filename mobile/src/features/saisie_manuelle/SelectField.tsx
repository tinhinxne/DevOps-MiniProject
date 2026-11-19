// import { Ionicons } from '@expo/vector-icons';
// import { useState } from 'react';
// import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
// import { Input } from '../../components';
// import { colors, fontSize, radius, spacing } from '../../theme';

// type Props = {
//   label: string;
//   labelColor?: string;
//   value: string;
//   options: string[];
//   onChange: (value: string) => void;
// };

// export function SelectField({ label, labelColor, value, options, onChange }: Props) {
//   const [visible, setVisible] = useState(false);

//   return (
//     <>
//       <Pressable
//         onPress={() => setVisible(true)}
//         accessibilityRole="button"
//         accessibilityLabel={label}
//       >
//         <View pointerEvents="none">
//           <Input
//             label={label}
//             labelColor={labelColor}
//             value={value}
//             editable={false}
//             rightIcon={<Ionicons name="chevron-down" size={20} color={colors.brandDeep} />}
//           />
//         </View>
//       </Pressable>

//       <Modal
//         visible={visible}
//         transparent
//         animationType="slide"
//         onRequestClose={() => setVisible(false)}
//       >
//         <View style={styles.overlay}>
//           <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
//           <View style={styles.sheet}>
//             <Text style={styles.sheetTitle}>{label}</Text>
//             {options.map((option) => {
//               const selected = option === value;
//               return (
//                 <Pressable
//                   key={option}
//                   onPress={() => {
//                     onChange(option);
//                     setVisible(false);
//                   }}
//                   accessibilityRole="radio"
//                   accessibilityState={{ selected }}
//                   style={styles.option}
//                 >
//                   <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
//                     {option}
//                   </Text>
//                   {selected ? (
//                     <Ionicons name="checkmark" size={20} color={colors.brandDeep} />
//                   ) : null}
//                 </Pressable>
//               );
//             })}
//           </View>
//         </View>
//       </Modal>
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: { flex: 1, justifyContent: 'flex-end' },
//   backdrop: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: colors.text,
//     opacity: 0.4,
//   },
//   sheet: {
//     backgroundColor: colors.card,
//     borderTopLeftRadius: radius.lg,
//     borderTopRightRadius: radius.lg,
//     padding: spacing.lg,
//     gap: spacing.xs,
//   },
//   sheetTitle: {
//     fontSize: fontSize.md,
//     fontWeight: '700',
//     color: colors.brandDeep,
//     marginBottom: spacing.sm,
//   },
//   option: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: spacing.md,
//   },
//   optionText: { fontSize: fontSize.md, color: colors.text },
//   optionTextSelected: { fontWeight: '700', color: colors.brandDeep },
// });

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '../../theme';

type Props = {
  label: string;
  labelColor?: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
};

export function SelectField({ label, labelColor, value, options, onChange }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={styles.wrapper}
      >
        <Text style={[styles.label, labelColor ? { color: labelColor } : null]}>{label}</Text>
        <View style={styles.field}>
          <Text style={styles.value} numberOfLines={1}>
            {value}
          </Text>
          <Ionicons name="chevron-down" size={20} color={colors.brandDeep} />
        </View>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{label}</Text>
            {options.map((option) => {
              const selected = option === value;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    onChange(option);
                    setVisible(false);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  style={styles.option}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {selected ? (
                    <Ionicons name="checkmark" size={20} color={colors.brandDeep} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 54,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  value: { flex: 1, fontSize: fontSize.md, color: colors.text },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.text,
    opacity: 0.4,
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  sheetTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.brandDeep,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  optionText: { fontSize: fontSize.md, color: colors.text },
  optionTextSelected: { fontWeight: '700', color: colors.brandDeep },
});