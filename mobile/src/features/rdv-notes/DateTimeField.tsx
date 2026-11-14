import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Button, Input } from '../../components';
import { colors, radius, spacing } from '../../theme';
import { formatDate, formatTime } from '../../utils/datetime';

type Props = {
  label: string;
  mode: 'date' | 'time';
  value: Date | null;
  onChange: (date: Date) => void;
  placeholder?: string;
};

export function DateTimeField({ label, mode, value, onChange, placeholder }: Props) {
  const [visible, setVisible] = useState(false);
  const [draft, setDraft] = useState<Date>(new Date());

  const open = () => {
    const start = value ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: start,
        mode,
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, selected?: Date) => {
          if (event.type === 'set' && selected) onChange(selected);
        },
      });
      return;
    }
    setDraft(start);
    setVisible(true);
  };

  const confirm = () => {
    onChange(draft);
    setVisible(false);
  };

  const text = value ? (mode === 'date' ? formatDate(value) : formatTime(value)) : '';

  return (
    <>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={label}>
        <View pointerEvents="none">
          <Input
            label={label}
            labelColor={colors.textSoft}
            value={text}
            placeholder={placeholder}
            editable={false}
            rightIcon={
              <Ionicons
                name={mode === 'date' ? 'calendar-outline' : 'time-outline'}
                size={20}
                color={colors.textMuted}
              />
            }
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' ? (
        <Modal
          visible={visible}
          transparent
          animationType="slide"
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.overlay}>
            <Pressable style={styles.backdrop} onPress={() => setVisible(false)} />
            <View style={styles.sheet}>
              <DateTimePicker
                value={draft}
                mode={mode}
                display={mode === 'date' ? 'inline' : 'spinner'}
                locale="fr-FR"
                onChange={(_event, selected) => {
                  if (selected) setDraft(selected);
                }}
              />
              <Button title="Valider" variant="brand" onPress={confirm} />
            </View>
          </View>
        </Modal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
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
    gap: spacing.md,
  },
});