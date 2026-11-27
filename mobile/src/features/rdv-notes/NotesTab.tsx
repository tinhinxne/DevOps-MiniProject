
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import {
  cocherNote,
  creerNote,
  listerNotes,
  prochainRendezVous,
  type NoteApi,
  type RendezVousApi,
} from '../../utils/api';
import { formatShortDate } from '../../utils/datetime';

type Kind = 'question' | 'note';

type Props = { onSaved?: () => void };

export function NotesTab(_props: Props) {
  const [notes, setNotes] = useState<NoteApi[]>([]);
  const [prochain, setProchain] = useState<RendezVousApi | null>(null);
  const [kind, setKind] = useState<Kind>('question');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  // Au chargement : notes et questions + prochain rendez-vous (pour le titre)
  useEffect(() => {
    listerNotes()
      .then(setNotes)
      .catch((e: any) => setError(e.message || 'Impossible de charger les notes.'));
    prochainRendezVous()
      .then(setProchain)
      .catch(() => {});
  }, []);

  // Questions du prochain rdv (ou pas encore rattachées à un rdv)
  const questions = notes.filter(
    (n) => n.type === 'QUESTION' && (!n.rendezVousId || n.rendezVousId === prochain?.id),
  );
  const memos = notes.filter((n) => n.type === 'MEMO');

  const groupTitle = prochain
    ? `À poser à ${prochain.medecin ?? 'votre médecin'} · ${formatShortDate(new Date(prochain.dateRdv))}`
    : 'Questions à poser au médecin';

  const toggleQuestion = async (id: string, fait: boolean) => {
    // on met à jour l'écran tout de suite, puis on prévient le serveur
    setNotes((current) => current.map((n) => (n.id === id ? { ...n, fait: !fait } : n)));
    try {
      await cocherNote(id, !fait);
    } catch (e: any) {
      setNotes((current) => current.map((n) => (n.id === id ? { ...n, fait } : n)));
      setError(e.message || 'Impossible de mettre à jour la question.');
    }
  };

  const handleSave = async () => {
    const value = text.trim();
    if (!value || saving) return;
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const created = await creerNote({
        type: kind === 'question' ? 'QUESTION' : 'MEMO',
        contenu: value,
      });
      setNotes((current) => [...current, created]);
      setText('');
      setSuccess(kind === 'question' ? 'Question ajoutée ✓' : 'Note enregistrée ✓');
    } catch (e: any) {
      setError(e.message || "Impossible d'enregistrer.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.groupTitle}>{groupTitle}</Text>

      {questions.map((q) => (
        <Pressable
          key={q.id}
          onPress={() => toggleQuestion(q.id, q.fait)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: q.fait }}
        >
          <Card style={styles.item}>
            <View style={[styles.checkbox, q.fait && styles.checkboxDone]}>
              {q.fait ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
            </View>
            <View style={styles.itemText}>
              <Text style={[styles.questionText, q.fait && styles.questionDone]}>{q.contenu}</Text>
              <Text style={styles.caption}>Question</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <View style={styles.sectionTitle}>
        <View style={styles.bar} />
        <Text style={styles.sectionTitleText}>Notes personnelles</Text>
      </View>

      {memos.map((n) => (
        <Card key={n.id} style={styles.item}>
          <View style={styles.itemText}>
            <Text style={styles.noteDate}>{formatShortDate(new Date(n.dateCreation))}</Text>
            <Text style={styles.caption}>{n.contenu}</Text>
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

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <View style={styles.submit}>
        <Button
          title={saving ? 'Enregistrement...' : 'Enregistrer'}
          variant="brand"
          onPress={handleSave}
          disabled={saving}
        />
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
  error: { color: 'red', fontSize: fontSize.sm, textAlign: 'center' },
  success: { color: colors.success, fontSize: fontSize.sm, textAlign: 'center', fontWeight: '600' },
});