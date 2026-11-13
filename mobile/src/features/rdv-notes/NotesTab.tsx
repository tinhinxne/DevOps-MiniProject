import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatShortDate } from '../../utils/datetime';
import { getNotes, getQuestionsGroup, Note, Question } from './mock';

type Kind = 'question' | 'note';

type Props = { onSaved?: () => void };

export function NotesTab({ onSaved }: Props) {
  const group = getQuestionsGroup();
  const [questions, setQuestions] = useState<Question[]>(group.items);
  const [notes, setNotes] = useState<Note[]>(getNotes());
  const [kind, setKind] = useState<Kind>('question');
  const [text, setText] = useState('');

  const toggleQuestion = (id: string) => {
    setQuestions((current) =>
      current.map((q) => (q.id === id ? { ...q, done: !q.done } : q)),
    );
  };

  const handleSave = () => {
    const value = text.trim();
    if (!value) return;
    // TODO: enregistrer en base (SQLite) quand elle sera prête
    if (kind === 'question') {
      setQuestions((current) => [
        ...current,
        { id: Date.now().toString(), text: value, done: false },
      ]);
    } else {
      setNotes((current) => [
        ...current,
        { id: Date.now().toString(), date: formatShortDate(new Date()), text: value },
      ]);
    }
    setText('');
        onSaved?.();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.groupTitle}>{group.title}</Text>

      {questions.map((q) => (
        <Pressable
          key={q.id}
          onPress={() => toggleQuestion(q.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: q.done }}
        >
          <Card style={styles.item}>
            <View style={[styles.checkbox, q.done && styles.checkboxDone]}>
              {q.done ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
            </View>
            <View style={styles.itemText}>
              <Text style={[styles.questionText, q.done && styles.questionDone]}>{q.text}</Text>
              <Text style={styles.caption}>Question</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <View style={styles.sectionTitle}>
        <View style={styles.bar} />
        <Text style={styles.sectionTitleText}>Notes personnelles</Text>
      </View>

      {notes.map((n) => (
        <Card key={n.id} style={styles.item}>
          <View style={styles.itemText}>
            <Text style={styles.noteDate}>{n.date}</Text>
            <Text style={styles.caption}>{n.text}</Text>
          </View>
        </Card>
      ))}

      <View style={styles.chips}>
        <Pressable
          onPress={() => setKind('question')}
          style={[styles.chip, kind === 'question' && styles.chipSelected]}
        >
          <Text style={[styles.chipText, kind === 'question' && styles.chipTextSelected]}>
            Question
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setKind('note')}
          style={[styles.chip, kind === 'note' && styles.chipSelected]}
        >
          <Text style={[styles.chipText, kind === 'note' && styles.chipTextSelected]}>
            Notes
          </Text>
        </Pressable>
      </View>

      <Input
        value={text}
        onChangeText={setText}
        placeholder="Écrire ici .."
        multiline
        numberOfLines={3}
      />

      <View style={styles.submit}>
        <Button title="Enregistrer" variant="brand" onPress={handleSave} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  groupTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.modeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: colors.brand, borderColor: colors.brand },
  itemText: { flex: 1, gap: 2 },
  questionText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  questionDone: { textDecorationLine: 'line-through', color: colors.textSoft },
  caption: { fontSize: fontSize.sm, color: colors.textSoft },
  noteDate: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bar: { width: 4, height: 24, borderRadius: 2, backgroundColor: colors.accentBar },
  sectionTitleText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.brand },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
  chipTextSelected: { color: colors.white },
  submit: { marginTop: spacing.sm },
});