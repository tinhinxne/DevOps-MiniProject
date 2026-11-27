import { useCallback, useState } from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import { listerOrdonnances, listerTraitements, supprimerTraitement } from '@/utils/api';
import type { TraitementApi } from '@/utils/api';

const MOMENT: Record<string, string> = {
  REVEIL: 'Réveil',
  PETIT_DEJ: 'Petit-déj',
  DEJEUNER: 'Déjeuner',
  DINER: 'Dîner',
  COUCHER: 'Coucher',
  PERSO: 'Perso',
};
const fr = (d: Date) => d.toLocaleDateString('fr-FR');
const frIso = (s?: string | null) => (s ? s.slice(0, 10).split('-').reverse().join('/') : '');

function versDetail(t: TraitementApi, origine: string) {
  const total = t.dureeJours ?? 1;
  const debut = new Date(`${t.dateDebut.slice(0, 10)}T00:00:00`);
  const fin = new Date(debut);
  fin.setDate(fin.getDate() + total - 1);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  const jour = Math.floor((auj.getTime() - debut.getTime()) / 86400000) + 1;
  const qte = t.quantite ?? 1;
  const prevu = total * t.rappels.length * qte;
  return {
    name: t.nom,
    dosageForme: [t.dosage, t.frequence].filter(Boolean).join(' · '),
    origine,
    status: jour > total ? 'Terminé' : 'En cours',
    prises: t.rappels.map((r, i) => ({
      id: String(i),
      label: MOMENT[r.moment] ?? r.moment,
      time: r.heure,
      quantity: `${qte} cp`,
    })),
    dayCurrent: Math.min(Math.max(jour, 1), total),
    dayTotal: total,
    startDate: fr(debut),
    endDate: fr(fin),
    stockLabel:
      t.stockRestant == null ? 'Stock non renseigné' : `${t.stockRestant} comprimés restants`,
    stockPercent: t.stockRestant == null || prevu === 0 ? 0 : (t.stockRestant / prevu) * 100,
    instructions: t.instructions || 'Aucune instruction.',
  };
}

function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const value = Math.min(100, Math.max(0, percent));
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

export function DetailMedicamentScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [med, setMed] = useState<ReturnType<typeof versDetail> | null>(null);
  const [trait, setTrait] = useState<TraitementApi | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  // Recharge à chaque retour sur l'écran (ex. après une modification).
  useFocusEffect(
    useCallback(() => {
      let actif = true;
      (async () => {
        try {
          const [traitements, ords] = await Promise.all([listerTraitements(), listerOrdonnances()]);
          if (!actif) return;
          const t = traitements.find((x) => x.id === id);
          if (!t) return setErreur('Médicament introuvable.');
          const o = ords.find((x) => x.id === t.ordonnanceId);
          setErreur(null);
          setTrait(t);
          setMed(
            versDetail(
              t,
              o ? `Ordonnance : ${o.titre || `du ${frIso(o.dateEmission)}`}` : 'Saisie manuelle',
            ),
          );
        } catch (e) {
          if (actif) setErreur(e instanceof Error ? e.message : 'Chargement impossible.');
        }
      })();
      return () => {
        actif = false;
      };
    }, [id]),
  );

  // Envoie directement à l'écran de configuration de prise, en mode modification
  // (la présence de `id` indique qu'il faut modifier et non créer).
  const handleEdit = () => {
    if (!trait) return;
    router.push({
      pathname: '/configurer-prise',
      params: {
        id: trait.id,
        nom: trait.nom,
        dosage: trait.dosage ?? '',
        quantite: String(trait.quantite ?? 1),
        dureeJours: String(trait.dureeJours ?? 1),
        stockRestant: trait.stockRestant != null ? String(trait.stockRestant) : '',
        instructions: trait.instructions ?? '',
        rappels: JSON.stringify(trait.rappels),
        ordonnanceId: trait.ordonnanceId ?? '',
        dateDebut: trait.dateDebut.slice(0, 10),
      },
    } as unknown as Href);
  };

  const handleDelete = () => {
    Alert.alert('Supprimer ce médicament ?', 'Cette action est définitive.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!id) return;
            await supprimerTraitement(id);
            router.back();
          } catch (e) {
            Alert.alert(
              'Suppression impossible',
              e instanceof Error ? e.message : 'Réessaie dans un instant.',
            );
          }
        },
      },
    ]);
  };

  if (!med) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ padding: spacing.lg, color: erreur ? colors.danger : colors.textLabel }}>
          {erreur ?? 'Chargement...'}
        </Text>
      </SafeAreaView>
    );
  }
  const progress = Math.round((med.dayCurrent / med.dayTotal) * 100);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
            <Text style={styles.title}>Détail du médicament</Text>
            <Text style={styles.subtitle}>{med.origine}</Text>
          </View>
        </View>

        <Card style={styles.card}>
          <View style={styles.identity}>
            <View style={styles.pillBox}>
              <MaterialCommunityIcons name="pill" size={28} color={colors.brand} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.medName}>{med.name}</Text>
              <Text style={styles.medMeta}>{med.dosageForme}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{med.status}</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Prises quotidiennes</Text>
          <View style={styles.doses}>
            {med.prises.map((p) => (
              <View key={p.id} style={styles.dose}>
                <Text style={styles.doseLabel}>{p.label}</Text>
                <Text style={styles.doseTime}>{`${p.time} · ${p.quantity}`}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Durée du traitement</Text>
            <Text style={styles.progressText}>{`Jour ${med.dayCurrent} sur ${med.dayTotal}`}</Text>
          </View>
          <ProgressBar percent={progress} color={colors.brandDeep} />
          <View style={styles.rowBetween}>
            <Text style={styles.small}>{`Début : ${med.startDate}`}</Text>
            <Text style={styles.small}>{`Fin : ${med.endDate}`}</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Stock du médicament</Text>
          <Text style={styles.stockText}>{med.stockLabel}</Text>
          <ProgressBar percent={med.stockPercent} color={colors.success} />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.instructions}>{med.instructions}</Text>
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.flex}>
          <Button title="Modifier" variant="outline" onPress={handleEdit} />
        </View>
        <View style={styles.flex}>
          <Button title="Supprimer" variant="dangerOutline" onPress={handleDelete} />
        </View>
      </View>
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

  card: { padding: spacing.md, borderRadius: radius.md, gap: spacing.sm },
  cardTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDeep },

  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pillBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.tintSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.brandDeep },
  medMeta: { fontSize: fontSize.sm, color: colors.textLabel },
  badge: {
    backgroundColor: colors.tintMint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.successDeep },

  doses: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dose: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.tintSky,
  },
  doseLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  doseTime: { fontSize: 11, color: colors.textLabel },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.modeBorder, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
  small: { fontSize: 12, color: colors.textLabel },
  stockText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  instructions: { fontSize: fontSize.sm, color: colors.textLabel, lineHeight: 20 },

  footer: { flexDirection: 'row', gap: spacing.md, padding: spacing.lg },
});