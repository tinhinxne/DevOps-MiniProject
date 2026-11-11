import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export type AddChoice = 'medicament' | 'ordonnance' | 'rendez-vous';

type IconName = keyof typeof Ionicons.glyphMap;

const OPTIONS: {
  key: AddChoice;
  title: string;
  subtitle: string;
  icon: IconName;
  color: string;
  bg: string;
}[] = [
  { key: 'medicament', title: 'Un médicament', subtitle: 'Créer un traitement', icon: 'bandage-outline', color: colors.logoBlue, bg: colors.tintBlue },
  { key: 'ordonnance', title: 'Une ordonnance', subtitle: 'Importer une photo', icon: 'document-text-outline', color: colors.success, bg: colors.tintGreen },
  { key: 'rendez-vous', title: 'Un rendez-vous', subtitle: 'Planifier un rappel', icon: 'calendar-outline', color: colors.warning, bg: '#FFEDD5' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect?: (choice: AddChoice) => void;
};

export function AddSheet({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, progress]);

  // Animation de fermeture, puis on prévient le parent
  const close = (choice?: AddChoice) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      onClose();
      if (choice) onSelect?.(choice);
    });
  };

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={() => close()}>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: progress }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => close()} accessibilityLabel="Fermer" />
        </Animated.View>

        <Animated.View
          style={[styles.sheet, { marginBottom: Math.max(insets.bottom, 8), transform: [{ translateY }] }]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Ajouter</Text>
              <Text style={styles.subtitle}>Que souhaitez-vous enregistrer ?</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={() => close()} accessibilityLabel="Fermer">
              <Ionicons name="close" size={18} color="#1E3A8A" />
            </Pressable>
          </View>

          {OPTIONS.map((o) => (
            <Pressable key={o.key} style={styles.option} onPress={() => close(o.key)}>
              <View style={[styles.iconBox, { backgroundColor: o.bg }]}>
                <Ionicons name={o.icon} size={22} color={o.color} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.optionTitle}>{o.title}</Text>
                <Text style={styles.optionSub}>{o.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
 backdrop: {
   position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 8,
    borderRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginBottom: 14,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  subtitle: { fontSize: 13, color: '#64748B', marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
  },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  optionSub: { fontSize: 12, color: '#64748B', marginTop: 1 },
});