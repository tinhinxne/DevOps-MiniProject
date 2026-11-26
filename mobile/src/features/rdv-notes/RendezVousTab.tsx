import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, DateTimeField, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import {
  creerNote,
  creerRendezVous,
  listerRendezVous,
  type RendezVousApi,
} from '../../utils/api';
import { formatShortDate, formatTime } from '../../utils/datetime';
import type { RendezVous } from './mock';

type Props = { onSaved?: () => void };
type Item = RendezVous & { passe: boolean };
type RappelChoix = 'AUCUN' | 'MEME_JOUR' | '1J' | '2J';

const CHOIX_RAPPEL: { value: RappelChoix; label: string; decalage: number }[] = [
  { value: 'AUCUN', label: 'Aucun', decalage: 0 },
  { value: 'MEME_JOUR', label: 'Le jour même', decalage: 0 },
  { value: '1J', label: 'La veille', decalage: 1 },
  { value: '2J', label: '2 jours avant', decalage: 2 },
];

// Heure actuelle en millisecondes (utilisée uniquement dans les actions, pas pendant l'affichage)
const maintenant = () => new Date().getTime();

const deuxChiffres = (n: number) => String(n).padStart(2, '0');

// Heure proposée par défaut : 08:00 le jour même, 18:00 sinon
const heureParDefaut = (choix: RappelChoix): Date => {
  const d = new Date();
  d.setHours(choix === 'MEME_JOUR' ? 8 : 18, 0, 0, 0);
  return d;
};

// Vrai si le jour choisi est avant le jour de « ref » (l'heure n'est pas prise en compte)
const jourPasse = (d: Date, ref: Date): boolean => {
  const debut = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  return d.getTime() < debut.getTime();
};

// Le serveur renvoie une date ISO ; l'affichage attend du texte
const toItem = (r: RendezVousApi): Item => {
  const d = new Date(r.dateRdv);
  return {
    id: r.id,
    when: `${formatShortDate(d)} ${formatTime(d)}`,
    doctor: [r.medecin, r.specialite].filter(Boolean).join(', '),
    reminder: r.rappel ?? '',
    passe: d.getTime() < maintenant(),
  };
};

export function RendezVousTab(_props: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [date, setDate] = useState<Date | null>(null);
  const [time, setTime] = useState<Date | null>(null);
  const [doctor, setDoctor] = useState('');
  const [rappelChoix, setRappelChoix] = useState<RappelChoix>('AUCUN');
  const [rappelHeure, setRappelHeure] = useState<Date | null>(null);
  const [nuitConfirmee, setNuitConfirmee] = useState(false);
  const [questions, setQuestions] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  // « Maintenant », mis à jour à chaque fois que l'utilisateur choisit une date ou une heure
  const [now, setNow] = useState(() => new Date());

  const charger = () =>
  listerRendezVous()
    .then((list) => {
      // On n'affiche que les rdv à venir. Les passés restent en base.
      const aVenir = list.map(toItem).filter((i) => !i.passe);
      setItems(aVenir);
    })
    .catch((e: any) => setError(e.message || 'Impossible de charger les rendez-vous.'));

  // Au chargement : on récupère les rendez-vous depuis le serveur
  useEffect(() => {
    charger();
  }, []);

  // Moment du rendez-vous (date + heure combinées)
  const quand =
    date && time
      ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes())
      : null;

  // Moment du rappel : le bon jour, à l'heure choisie par l'utilisateur
  const decalage = CHOIX_RAPPEL.find((c) => c.value === rappelChoix)?.decalage ?? 0;
  const rappelLe =
    rappelChoix !== 'AUCUN' && date && rappelHeure
      ? new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() - decalage,
          rappelHeure.getHours(),
          rappelHeure.getMinutes(),
        )
      : null;

  // Messages affichés sous les champs Date et Heure
  const erreurDate =
    date && jourPasse(date, now)
      ? "Cette date est dans le passé. Choisissez une date à partir d'aujourd'hui."
      : '';
  const erreurHeure =
    !erreurDate && quand && quand.getTime() <= now.getTime()
      ? "Cette heure est déjà passée pour aujourd'hui. Choisissez une heure plus tard."
      : '';

  const choisirDate = (d: Date | null) => {
    setNow(new Date());
    setError('');
    setSuccess('');
    setDate(d);
  };

  const choisirHeure = (t: Date | null) => {
    setNow(new Date());
    setError('');
    setSuccess('');
    setTime(t);
  };

  const choisirRappel = (choix: RappelChoix) => {
    setRappelChoix(choix);
    setRappelHeure(choix === 'AUCUN' ? null : heureParDefaut(choix));
    setNuitConfirmee(false);
    setError('');
  };

  const choisirHeureRappel = (h: Date | null) => {
    setRappelHeure(h);
    setNuitConfirmee(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setError('');
    setSuccess('');

    if (!date) return setError('Choisissez une date.');
    if (jourPasse(date, new Date())) {
      return setError("Cette date est dans le passé. Choisissez une date à partir d'aujourd'hui.");
    }
    if (!time || !quand) return setError('Choisissez une heure.');
    if (!doctor.trim()) return setError('Indiquez le médecin.');
    if (quand.getTime() <= maintenant()) {
      return setError("La date et l'heure doivent être dans le futur.");
    }

    // Vérifications du rappel
    if (rappelChoix !== 'AUCUN') {
      if (!rappelHeure || !rappelLe) return setError("Choisissez l'heure du rappel.");
      if (rappelLe.getTime() <= maintenant()) {
        return setError('Ce rappel est déjà passé. Choisissez un autre jour ou une autre heure.');
      }
      if (rappelLe.getTime() >= quand.getTime()) {
        return setError('Le rappel doit être avant le rendez-vous. Choisissez la veille.');
      }
      // Rappel de nuit : on prévient, et on demande de confirmer en réappuyant
      const h = rappelHeure.getHours();
      if ((h >= 22 || h < 7) && !nuitConfirmee) {
        setNuitConfirmee(true);
        return setError(
          'Ce rappel sonnera la nuit (22:00-07:00). Appuyez de nouveau sur Enregistrer pour confirmer.',
        );
      }
    }

    setSaving(true);
    try {
      // « Dr Nom, spécialité » : avant la virgule = médecin, après = spécialité
      const [nom, ...reste] = doctor.split(',');
      const created = await creerRendezVous({
        dateRdv: quand.toISOString(),
        medecin: nom.trim(),
        specialite: reste.join(',').trim() || undefined,
        ...(rappelChoix !== 'AUCUN' && rappelHeure && rappelLe
          ? {
              rappelJour: rappelChoix,
              rappelHeure: `${deuxChiffres(rappelHeure.getHours())}:${deuxChiffres(rappelHeure.getMinutes())}`,
              rappelLe: rappelLe.toISOString(),
            }
          : {}),
      });

      // Chaque ligne du champ « Questions » devient une question rattachée à ce rdv
      const lignes = questions
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      let questionsOk = true;
      for (const contenu of lignes) {
        try {
          await creerNote({ type: 'QUESTION', contenu, rendezVousId: created.id });
        } catch {
          questionsOk = false;
        }
      }

      await charger(); // la liste revient du serveur, triée par date
      setDate(null);
      setTime(null);
      setDoctor('');
      setRappelChoix('AUCUN');
      setRappelHeure(null);
      setNuitConfirmee(false);
      setQuestions('');
      if (questionsOk) {
        setSuccess('Rendez-vous enregistré ✓');
      } else {
        setError("Rendez-vous enregistré, mais certaines questions n'ont pas pu l'être.");
      }
    } catch (e: any) {
      setError(e.message || "Impossible d'enregistrer le rendez-vous.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      {items.map((item) => (
        <View key={item.id} style={[styles.card, item.passe && styles.cardPasse]}>
          <View style={styles.iconBubble}>
            <Ionicons name="calendar-outline" size={22} color={colors.brand} />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.when}>{item.when}</Text>
            <Text style={styles.detail}>{item.doctor}</Text>
            {item.reminder ? <Text style={styles.detail}>Rappel : {item.reminder}</Text> : null}
          </View>
          <View style={[styles.badge, item.passe && styles.badgePasse]}>
            <Text style={[styles.badgeText, item.passe && styles.badgeTextPasse]}>
              {item.passe ? 'Passé' : 'À venir'}
            </Text>
          </View>
        </View>
      ))}

      <View style={styles.sectionTitle}>
        <View style={styles.bar} />
        <Text style={styles.sectionTitleText}>Nouveau rendez-vous</Text>
      </View>

      <View style={styles.row}>
        <View style={styles.dateCol}>
          <DateTimeField
            label="Date"
            mode="date"
            value={date}
            onChange={choisirDate}
            placeholder="JJ/MM/AAAA"
          />
        </View>
        <View style={styles.timeCol}>
          <DateTimeField
            label="Heure"
            mode="time"
            value={time}
            onChange={choisirHeure}
            placeholder="HH:MM"
          />
        </View>
      </View>
      {erreurDate ? <Text style={styles.erreurChamp}>{erreurDate}</Text> : null}
      {erreurHeure ? <Text style={styles.erreurChamp}>{erreurHeure}</Text> : null}

      <Input
        label="Médecin"
        labelColor={colors.textSoft}
        value={doctor}
        onChangeText={setDoctor}
        placeholder="Dr Nom, spécialité"
      />

      <View style={styles.rappelBlock}>
        <Text style={styles.label}>Rappel</Text>
        <View style={styles.chips}>
          {CHOIX_RAPPEL.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => choisirRappel(c.value)}
              style={[styles.chip, rappelChoix === c.value && styles.chipSelected]}
            >
              <Text style={[styles.chipText, rappelChoix === c.value && styles.chipTextSelected]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {rappelChoix !== 'AUCUN' && (
          <>
            <DateTimeField
              label="Heure du rappel"
              mode="time"
              value={rappelHeure}
              onChange={choisirHeureRappel}
              placeholder="HH:MM"
            />
            {rappelLe ? (
              <Text style={styles.hint}>
                Rappel prévu : {formatShortDate(rappelLe)} à {formatTime(rappelLe)}
              </Text>
            ) : (
              <Text style={styles.hint}>Choisissez la date du rendez-vous pour voir le rappel.</Text>
            )}
          </>
        )}
      </View>

      <Input
        label="Questions à poser au médecin (une par ligne)"
        labelColor={colors.textSoft}
        value={questions}
        onChangeText={setQuestions}
        placeholder="..."
        multiline
        numberOfLines={3}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <View style={styles.submit}>
        <Button
          title={saving ? 'Enregistrement...' : 'Enregistrer le rendez-vous'}
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
  cardPasse: { opacity: 0.6 },
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
  badgePasse: { backgroundColor: colors.border },
  badgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
  badgeTextPasse: { color: colors.textSoft },
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
  erreurChamp: { color: 'red', fontSize: fontSize.sm, fontWeight: '600' },
  rappelBlock: { gap: spacing.sm },
  label: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textSoft },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipSelected: { backgroundColor: colors.brand },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brand },
  chipTextSelected: { color: colors.white },
  hint: { fontSize: fontSize.sm, color: colors.textSoft },
  submit: { marginTop: spacing.sm },
  error: { color: 'red', fontSize: fontSize.sm, textAlign: 'center' },
  success: { color: colors.success, fontSize: fontSize.sm, textAlign: 'center', fontWeight: '600' },
});