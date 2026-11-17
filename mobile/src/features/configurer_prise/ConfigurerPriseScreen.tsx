import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { Alert } from 'react-native'; // ou ajoute Alert à ton import react-native existant
import { medicaments } from '../traitements/mock';
import { detecterInteractions, Interaction } from './interactions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, DateTimeField, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { formatTime } from '../../utils/datetime';
import { addManualMedication, FREQUENCES, getHabitMoments, Moment } from '../saisie_manuelle/mock';
import { SelectField } from '../saisie_manuelle/SelectField';

const DEFAULT_CUSTOM_TIME = new Date(2000, 0, 1, 15, 30);
const fmtDate = (d: Date) => d.toLocaleDateString('fr-FR');

export function ConfigurerPriseScreen() {
  const router = useRouter();
  // Valeurs de démonstration si on arrive sans paramètres
  const params = useLocalSearchParams<{
    nom?: string;
    dosage?: string;
    dci?: string;
    forme?: string;
  }>();
  const nom = params.nom ?? 'Doliprane';
  const dosage = params.dosage ?? '500 mg';
  const dci = params.dci ?? 'paracétamol';
  const forme = (params.forme ?? 'comprimé').toLowerCase();

  const [moments, setMoments] = useState<Moment[]>(getHabitMoments());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState<Date>(DEFAULT_CUSTOM_TIME);
  const [quantity, setQuantity] = useState(1);
  const [frequence, setFrequence] = useState(FREQUENCES[0]);
  const [days, setDays] = useState(7);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [instructions, setInstructions] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const interactions = detecterInteractions(
  { nom, dci },
  medicaments.map((m) => ({ nom: m.nom })),
);
const alerte = interactions[0];
  const plural = (n: number) => (n > 1 && !forme.endsWith('s') ? `${forme}s` : forme);
  const prisesParJour = selectedIds.length;
  const total = prisesParJour * quantity * days;
  const finPrevue = new Date(startDate);
  finPrevue.setDate(finPrevue.getDate() + days - 1);

  const toggleMoment = (id: string) =>
    setSelectedIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const handleAddCustom = () => {
    const time = formatTime(customTime);
    const existing = moments.find((m) => m.time === time);
    if (existing) {
      setSelectedIds((cur) => (cur.includes(existing.id) ? cur : [...cur, existing.id]));
      return;
    }
    const id = `perso-${time}`;
    setMoments((cur) => [...cur, { id, label: 'Perso', time }]);
    setSelectedIds((cur) => [...cur, id]);
  };

  const choisirPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const enregistrer = () => {
  const times = moments
    .filter((m) => selectedIds.includes(m.id))
    .map((m) => m.time)
    .sort();
  addManualMedication({
    name: nom,
    dosage,
    forme,
    times,
    frequence,
    durationDays: days,
    quantity,
    startDate: startDate.toISOString(),
    instructions: instructions.trim(),
  });
  setError('');
  router.replace('/ordonnances');
};

const handleSave = () => {
  if (selectedIds.length === 0) {
    setError('Choisis au moins un moment de prise.');
    return;
  }
  if (alerte?.gravite === 'rouge') {
    Alert.alert(
      'Interaction grave',
      `${alerte.message}\n\nVoulez-vous quand même l'ajouter ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Ajouter quand même', style: 'destructive', onPress: enregistrer },
      ],
    );
    return;
  }
  enregistrer();
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
              <Text style={styles.title}>Configurer la prise</Text>
              <Text style={styles.subtitle}>Précisez comment prendre le médicament</Text>
            </View>
          </View>

          <View style={styles.medCard}>
            <View style={styles.pillTile}>
              <View style={styles.pill}>
                <View style={[styles.pillHalf, { backgroundColor: '#0AA5E0', borderTopLeftRadius: 9, borderBottomLeftRadius: 9 }]} />
                <View style={[styles.pillHalf, { backgroundColor: '#D5F5DE', borderTopRightRadius: 9, borderBottomRightRadius: 9 }]} />
              </View>
            </View>
            <View style={styles.flex}>
              <Text style={styles.medName}>
                {nom} {dosage}
              </Text>
              <Text style={styles.medMeta}>
                DCI · {dci} · {forme}
              </Text>
            </View>
            <View style={styles.medSide}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Référentiel</Text>
              </View>
              <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
                <Text style={styles.change}>Changer</Text>
              </Pressable>
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
                  <Text style={[styles.chipLabel, selected && styles.chipTextSelected]}>{m.label}</Text>
                  <Text style={[styles.chipTime, selected && styles.chipTextSelected]}>{m.time}</Text>
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
              <Text style={styles.label}>Quantité par prise</Text>
              <Stepper
                label={`${quantity} ${plural(quantity)}`}
                onMinus={() => setQuantity((q) => Math.max(1, q - 1))}
                onPlus={() => setQuantity((q) => Math.min(10, q + 1))}
              />
            </View>
            <View style={styles.flex}>
              <SelectField
                label="Fréquence"
                labelColor={colors.brandDeep}
                value={frequence}
                options={FREQUENCES}
                onChange={setFrequence}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>Durée</Text>
              <Stepper
                label={`${days} jour${days > 1 ? 's' : ''}`}
                onMinus={() => setDays((d) => Math.max(1, d - 1))}
                onPlus={() => setDays((d) => Math.min(365, d + 1))}
              />
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

          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Fin prévue : {fmtDate(finPrevue)}</Text>
            <Text style={styles.summaryText}>
              {prisesParJour} prise{prisesParJour > 1 ? 's' : ''} par jour · {total} {plural(total)} au total
            </Text>
          </View>

          <Input
            label="Instructions (facultatif)"
            labelColor={colors.textLabel}
            value={instructions}
            onChangeText={setInstructions}
            placeholder="Ex. : pendant les repas"
          />

          <Pressable onPress={choisirPhoto} accessibilityRole="button" hitSlop={6}>
            <Text style={styles.photoLink}>
              {photoUri
                ? "✓ Photo d'ordonnance associée (changer)"
                : "+ Associer une photo d'ordonnance (facultatif)"}
            </Text>
          </Pressable>
        </ScrollView>

        <View style={styles.footer}>
  {alerte ? (
    <AlerteInteraction interaction={alerte} autres={interactions.length - 1} />
  ) : null}
  {error ? <Text style={styles.error}>{error}</Text> : null}
  <Button title="Ajouter au traitement" variant="deep" onPress={handleSave} />
</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Stepper({
  label,
  onMinus,
  onPlus,
}: {
  label: string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <View style={styles.stepper}>
      <Pressable onPress={onMinus} style={styles.stepButton} hitSlop={6} accessibilityLabel="Diminuer">
        <Ionicons name="remove" size={18} color={colors.brandDeep} />
      </Pressable>
      <Text style={styles.stepValue}>{label}</Text>
      <Pressable onPress={onPlus} style={styles.stepButton} hitSlop={6} accessibilityLabel="Augmenter">
        <Ionicons name="add" size={18} color={colors.brandDeep} />
      </Pressable>
    </View>
  );
}
const ALERTE_STYLE = {
  jaune: { fond: colors.tintWarning, bord: colors.warning, texte: '#92400E', icone: 'information-circle', titre: 'Interaction à surveiller' },
  orange: { fond: '#FFEDD5', bord: '#FB923C', texte: '#9A3412', icone: 'warning', titre: 'Interaction importante' },
  rouge: { fond: colors.tintDanger, bord: colors.danger, texte: '#991B1B', icone: 'alert-circle', titre: 'Interaction grave' },
} as const;

function AlerteInteraction({ interaction, autres }: { interaction: Interaction; autres: number }) {
  const s = ALERTE_STYLE[interaction.gravite];
  return (
    <View
      accessibilityRole="alert"
      style={[styles.alerte, { backgroundColor: s.fond, borderColor: s.bord }]}>
      <Ionicons name={s.icone} size={22} color={s.texte} />
      <View style={styles.flex}>
        <Text style={[styles.alerteTitre, { color: s.texte }]}>
          {s.titre} avec {interaction.avec}
        </Text>
        <Text style={[styles.alerteTexte, { color: s.texte }]}>{interaction.message}</Text>
        {autres > 0 && (
          <Text style={[styles.alerteTexte, { color: s.texte }]}>
            + {autres} autre{autres > 1 ? 's' : ''} interaction{autres > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </View>
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
  alerte: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  gap: spacing.sm,
  padding: spacing.md,
  borderRadius: radius.md,
  borderWidth: 1.5,
},
alerteTitre: { fontSize: fontSize.sm, fontWeight: '700' },
alerteTexte: { fontSize: fontSize.xs },
  medCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.modeBorder,
  },
  pillTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.tintSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: { flexDirection: 'row', width: 28, height: 16, transform: [{ rotate: '-35deg' }] },
  pillHalf: { flex: 1 },
  medName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  medMeta: { fontSize: fontSize.xs, color: colors.textLabel },
  medSide: { alignItems: 'flex-end', gap: spacing.xs },
  badge: {
    backgroundColor: colors.tintMint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
  },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600', color: colors.successDeep },
  change: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },

  row: { flexDirection: 'row', gap: spacing.md },
label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDeep },
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
  chipTime: { fontSize: fontSize.xs, color: colors.textLabel },
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

  summary: {
    backgroundColor: colors.tintSky,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: 2,
  },
  summaryTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  summaryText: { fontSize: fontSize.sm, color: colors.textLabel },

  photoLink: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDeep },

  footer: { padding: spacing.lg, gap: spacing.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
});