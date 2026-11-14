import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatShortDate, formatTime } from '../../utils/datetime';
import { DateTimeField } from './DateTimeField';
import { getRendezVous, RendezVous } from './mock';

type Props = { onSaved?: () => void };

export function RendezVousTab({ onSaved }: Props) {
  const [items, setItems] = useState<RendezVous[]>(getRendezVous());
   const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [doctor, setDoctor] = useState('');
  const [reminder, setReminder] = useState('');
  const [questions, setQuestions] = useState('');

//   const handleSave = () => {
//     if (!date.trim() || !doctor.trim()) return;
//     // TODO: enregistrer en base (SQLite) quand elle sera prête
//     setItems((current) => [
//       ...current,
//       {
//         id: Date.now().toString(),
//         when: `${date.trim()} ${time.trim()}`.trim(),
//         doctor: doctor.trim(),
//         reminder: reminder.trim(),
//       },
//     ]);
//     setDate('');
//     setTime('');
//     setDoctor('');
//     setReminder('');
//     setQuestions('');
//   };
  const handleSave = () => {
    if (!date || !doctor.trim()) return;
    // TODO: enregistrer en base (SQLite) quand elle sera prête
    const when = `${formatShortDate(date)} ${time ? formatTime(time) : ''}`.trim();
    setItems((current) => [
      ...current,
      {
        id: Date.now().toString(),
        when,
        doctor: doctor.trim(),
        reminder: reminder.trim(),
      },
    ]);
    setDate(null);
    setTime(null);
    setDoctor('');
    setReminder('');
    setQuestions('');
    onSaved?.();
  };


  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.iconBubble}>
            <Ionicons name="calendar-outline" size={22} color={colors.brand} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.when}>{item.when}</Text>
            <Text style={styles.detail}>{item.doctor}</Text>
            {item.reminder ? <Text style={styles.detail}>{item.reminder}</Text> : null}
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>À venir</Text>
          </View>
        </View>
      ))}

            <View style={styles.sectionTitle}>
        <View style={styles.bar} />
        <Text style={styles.sectionTitleText}>Nouveau rendez-vous</Text>
      </View>

      {/* <View style={styles.row}>
        <View style={styles.dateCol}>
          <Input
            label="Date"
            labelColor={colors.textSoft}
            value={date}
            onChangeText={setDate}
            placeholder="JJ/MM/AAAA"
            keyboardType="numbers-and-punctuation"
          />
        </View>
        <View style={styles.timeCol}>
          <Input
            label="Heure"
            labelColor={colors.textSoft}
            value={time}
            onChangeText={setTime}
            placeholder="HH:MM"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View> */}

            <View style={styles.row}>
        <View style={styles.dateCol}>
          <DateTimeField
            label="Date"
            mode="date"
            value={date}
            onChange={setDate}
            placeholder="JJ/MM/AAAA"
          />
        </View>
        <View style={styles.timeCol}>
          <DateTimeField
            label="Heure"
            mode="time"
            value={time}
            onChange={setTime}
            placeholder="HH:MM"
          />
        </View>
      </View>

      <Input
        label="Médecin"
        labelColor={colors.textSoft}
        value={doctor}
        onChangeText={setDoctor}
        placeholder="Dr Nom, spécialité"
      />
      <Input
        label="Rappel"
        labelColor={colors.textSoft}
        value={reminder}
        onChangeText={setReminder}
        placeholder="La veille à 18:00"
      />
      <Input
        label="Questions à poser au médecin"
        labelColor={colors.textSoft}
        value={questions}
        onChangeText={setQuestions}
        placeholder="..."
        multiline
        numberOfLines={3}
      />

      <View style={styles.submit}>
        <Button title="Enregistrer le rendez-vous" variant="brand" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.text,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.tintBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: 2 },
  when: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  detail: { fontSize: fontSize.sm, color: colors.textSoft },
  badge: {
    backgroundColor: colors.tintBlue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
   sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bar: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.accentBar },
  sectionTitleText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', gap: spacing.md },
  dateCol: { flex: 3 },
  timeCol: { flex: 2 },
  submit: { marginTop: spacing.sm },
});