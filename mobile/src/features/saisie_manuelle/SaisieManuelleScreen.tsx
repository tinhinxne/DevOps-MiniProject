import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, DateTimeField, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatTime } from '../../utils/datetime';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  
  FORMES,
  FREQUENCES,
  getHabitMoments,
  Moment,
} from './mock';
import { SelectField } from './SelectField';
import { creerTraitement } from '../../utils/api';
import { momentDepuisLabel, ymd } from '../../utils/traitement';

const DEFAULT_CUSTOM_TIME = new Date(2000, 0, 1, 15, 30);

export function SaisieManuelleScreen() {
  const router = useRouter();
  const { ordonnanceId, patientId } = useLocalSearchParams<{ ordonnanceId?: string; patientId?: string }>();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [forme, setForme] = useState(FORMES[0]);
  const [moments, setMoments] = useState<Moment[]>(getHabitMoments());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState<Date>(DEFAULT_CUSTOM_TIME);
  const [frequence, setFrequence] = useState(FREQUENCES[0]);
  const [duration, setDuration] = useState('7');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState('');

  const unit = forme.toLowerCase();
  const quantityLabel = `${quantity} ${unit}${quantity > 1 && !unit.endsWith('s') ? 's' : ''}`;

  const toggleMoment = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  };

  const handleAddCustom = () => {
    const time = formatTime(customTime);
    const existing = moments.find((m) => m.time === time);
    if (existing) {
      setSelectedIds((current) =>
        current.includes(existing.id) ? current : [...current, existing.id],
      );
      return;
    }
    const id = `perso-${time}`;
    setMoments((current) => [...current, { id, label: 'Perso', time }]);
    setSelectedIds((current) => [...current, id]);
  };

    const handleSave = async () => {
    const days = parseInt(duration, 10);
    if (!name.trim()) return setError('Indique le nom du médicament.');
    if (selectedIds.length === 0) return setError('Choisis au moins un moment de prise.');
    if (!days || days < 1) return setError('Indique une durée en jours.');
    if (!patientId) return setError('Patient inconnu : ouvre cet écran depuis une ordonnance.');

    const choisis = moments
      .filter((m) => selectedIds.includes(m.id))
      .sort((a, b) => a.time.localeCompare(b.time));
    try {
      setSaving(true);
      setError('');
      await creerTraitement({
        patientId, ordonnanceId,
        nom: name.trim(),
        dosage: dosage.trim(),
        forme, frequence,
        dureeJours: days,
        quantite: quantity,
        dateDebut: ymd(startDate),
        instructions: instructions.trim(),
        saisieManuelle: true,
        rappels: choisis.map((m) => ({ moment: momentDepuisLabel(m.label), heure: m.time })),
      });
      router.replace('/ordonnances');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.back}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Retour"
            >
              <Ionicons name="chevron-back" size={20} color={colors.brandDeep} />
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.title}>Saisie manuelle</Text>
              <Text style={styles.subtitle}>Médicament absent du référentiel</Text>
            </View>
          </View>

          <View style={styles.banner}>
            <Text style={styles.bannerTitle}>Utilisable tout de suite</Text>
            <Text style={styles.bannerText}>
              {"Il sera disponible pour vos rappels dès l'enregistrement."}
            </Text>
          </View>

          <Input
            label="Nom du médicament"
            labelColor={colors.textLabel}
            value={name}
            onChangeText={setName}
            placeholder="Ex. : Nom saisi à la main"
          />

          <View style={styles.row}>
            <View style={styles.flex}>
              <Input
                label="Dosage"
                labelColor={colors.textLabel}
                value={dosage}
                onChangeText={setDosage}
                placeholder="500 mg"
              />
            </View>
            <View style={styles.flex}>
              <SelectField
                label="Forme"
                labelColor={colors.textLabel}
                value={forme}
                options={FORMES}
                onChange={setForme}
              />
            </View>
          </View>

          <Text style={styles.label}>Moments de prise (heures de « Mes habitudes »)</Text>
          <View style={styles.chips}>
            {moments.map((m) => {
              const selected = selectedIds.includes(m.id);
              return (
                <Pressable
                  key={m.id}
                  onPress={() => toggleMoment(m.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipLabel, selected && styles.chipTextSelected]}>
                    {m.label}
                  </Text>
                  <Text style={[styles.chipTime, selected && styles.chipTextSelected]}>
                    {m.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.label}>Ou choisir une heure personnalisée</Text>
          <View style={styles.customRow}>
            <View style={styles.flex}>
              <DateTimeField mode="time" value={customTime} onChange={setCustomTime} />
            </View>
            <Button title="Ajouter" variant="outline" onPress={handleAddCustom} />
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <SelectField
                label="Fréquence"
                labelColor={colors.textLabel}
                value={frequence}
                options={FREQUENCES}
                onChange={setFrequence}
              />
            </View>
            <View style={styles.flex}>
              <Input
                label="Durée (jours)"
                labelColor={colors.textLabel}
                value={duration}
                onChangeText={(t: string) => setDuration(t.replace(/[^0-9]/g, ''))}
                placeholder="7"
                keyboardType="number-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Quantité par prise</Text>
              <View style={styles.stepper}>
                <Pressable
                  onPress={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={styles.stepButton}
                  hitSlop={6}
                  accessibilityLabel="Diminuer la quantité"
                >
                  <Ionicons name="remove" size={18} color={colors.brandDeep} />
                </Pressable>
                <Text style={styles.stepValue}>{quantityLabel}</Text>
                <Pressable
                  onPress={() => setQuantity((q) => Math.min(10, q + 1))}
                  style={styles.stepButton}
                  hitSlop={6}
                  accessibilityLabel="Augmenter la quantité"
                >
                  <Ionicons name="add" size={18} color={colors.brandDeep} />
                </Pressable>
              </View>
            </View>
            <View style={styles.flex}>
             <DateTimeField
                label="Date de début"
                labelColor={colors.textLabel}
                mode="date"
                value={startDate}
                onChange={setStartDate}
                showIcon={false}
              />
            </View>
          </View>

          <Input
            label="Instructions (facultatif)"
            labelColor={colors.textLabel}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Ex. : pendant les repas"
            multiline
            numberOfLines={2}
          />
        </ScrollView>

        <View style={styles.footer}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button title="Enregistrer et activer les rappels" variant="deep" onPress={handleSave} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBackground },
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  back: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.modeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandDeep },
  subtitle: { fontSize: fontSize.sm, color: colors.textLabel },

  banner: {
    backgroundColor: colors.tintMint,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  bannerTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.successDeep },
  bannerText: { fontSize: fontSize.sm, color: colors.successDeep },

  row: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textLabel },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.modeBorder,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.brandDeep, borderColor: colors.brandDeep },
  chipLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  chipTime: { fontSize: 11, color: colors.textLabel },
  chipTextSelected: { color: colors.white },

  customRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },

  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 54,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.tintSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },

  footer: { padding: spacing.lg, gap: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
});