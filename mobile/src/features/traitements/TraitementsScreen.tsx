import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Href, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/Card';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SubPageHeader } from '@/components/SubPageHeader';
import { colors, fontSize, radius, spacing } from '@/theme';

import { Medicament, Ordonnance, medicaments, ordonnances } from './mock';

type Onglet = 'ordonnances' | 'medicaments';

const OPTIONS: { value: Onglet; label: string }[] = [
  { value: 'ordonnances', label: 'Mes ordonnances' },
  { value: 'medicaments', label: 'Mes médicaments' },
];

const PILULE: Record<Medicament['teinte'], [string, string]> = {
  bleu: ['#0AA5E0', '#D5F5DE'],
  vert: ['#4B7F6E', '#C9E6DA'],
  violet: ['#7C4DCC', '#C7D2FE'],
};

export function TraitementsScreen() {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>('ordonnances');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState('');
  const [liste, setListe] = useState<Ordonnance[]>(ordonnances);

  const q = recherche.trim().toLowerCase();
  const active = liste.find((o) => o.statut === 'active');
  const anciennes = liste.filter(
    (o) => o.statut === 'ancienne' && `ordonnance du ${o.delivreeLe}`.includes(q),
  );
  const meds = medicaments.filter((m) => m.nom.toLowerCase().includes(q));
  const stockFaible = medicaments.find((m) => m.stock !== undefined && m.stock < 5);
  const detail = liste.find((o) => o.id === detailId);

const ajouter = () =>
  router.push({
    pathname: '/configurer-prise',
    params: { nom: 'Doliprane', dosage: '500 mg', dci: 'paracétamol', forme: 'comprimé' },
  } as unknown as Href);  
  const ouvrirMed = (id: string) =>
    router.push({ pathname: '/detail-medicament', params: { id } } as unknown as Href);

  const scanner = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Caméra refusée',
        'Autorise la caméra dans les réglages pour scanner une ordonnance.',
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    if (res.canceled) return;

    const aujourdhui = new Date();
    const expire = new Date(aujourdhui);
    expire.setMonth(expire.getMonth() + 3);
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR');

    const nouvelle: Ordonnance = {
      id: `o${Date.now()}`,
      delivreeLe: fmt(aujourdhui),
      expireLe: fmt(expire),
      statut: 'active',
      photoUri: res.assets[0].uri,
    };
    setListe((l) => [
  nouvelle,
  ...l.map((o) => (o.statut === 'active' ? { ...o, statut: 'ancienne' as const } : o)),
]);
    setDetailId(nouvelle.id);
  };

  const changerOnglet = (v: Onglet) => {
    setOnglet(v);
    setDetailId(null);
    setRecherche('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <SubPageHeader title="Traitements" />
          <Text style={styles.subtitle}>Appuyez sur un médicament pour voir le détail.</Text>
        </View>

        <SegmentedTabs options={OPTIONS} value={onglet} onChange={changerOnglet} />

        {onglet === 'ordonnances' && !detail && (
          <>
            <Recherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Rechercher une ordonnance ..."
            />

            {active && (
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Ordonnances en cours</Text>
                  <View style={[styles.badge, { backgroundColor: colors.tintMint }]}>
                    <Text style={[styles.badgeText, { color: colors.successDeep }]}>• Active</Text>
                  </View>
                </View>
                <Card style={styles.activeCard}>
                  <Miniature uri={active.photoUri} />
                  <View style={styles.activeInfo}>
  <Text style={styles.body}>Délivrée le {active.delivreeLe}</Text>
  <View style={[styles.badge, { backgroundColor: colors.tintBlue, alignSelf: 'flex-start' }]}>
    <Text style={[styles.badgeText, { color: colors.brandDeep }]}>
      Valable jusqu&apos;au : {active.expireLe}
    </Text>
  </View>
  <ExpirationBadge expireLe={active.expireLe} />
  {joursRestants(active.expireLe) <= 30 && (
    <Pressable onPress={scanner} accessibilityRole="button" style={styles.renewBtn}>
      <Ionicons name="refresh" size={14} color={colors.white} />
      <Text style={styles.renewText}>Renouveler</Text>
    </Pressable>
  )}
  <Pressable
    onPress={() => setDetailId(active.id)}
    accessibilityRole="button"
    style={styles.linkRow}>
    <Text style={styles.link}>Voir les détails</Text>
    <Ionicons name="chevron-forward" size={14} color={colors.brandDeep} />
  </Pressable>
</View>
                </Card>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Ionicons name="time-outline" size={18} color={colors.brandDeep} />
                <Text style={styles.sectionTitle}>Mes anciennes ordonnances</Text>
              </View>
              {anciennes.map((o) => (
                <AncienneCard key={o.id} ordonnance={o} onVoir={() => setDetailId(o.id)} />
              ))}
            </View>

            <Pressable style={styles.scanBtn} accessibilityRole="button" onPress={scanner}>
              <Ionicons name="scan-outline" size={20} color={colors.brandDeep} />
              <Text style={styles.scanText}>Scanner une ordonnance</Text>
            </Pressable>
          </>
        )}

        {onglet === 'ordonnances' && detail && (
          <>
            <Card style={styles.detailCard}>
              <Text style={styles.detailTitle}>Ordonnance du {detail.delivreeLe}</Text>
              <View style={styles.detailRow}>
                <Miniature grande uri={detail.photoUri} />
                <Pressable style={styles.photoBtn} accessibilityRole="button">
                  <Text style={styles.photoBtnText}>Voir photo</Text>
                </Pressable>
              </View>
            </Card>
            {medicaments
              .filter((m) => m.ordonnanceId === detail.id)
              .map((m) => (
                <Pressable key={m.id} onPress={() => ouvrirMed(m.id)} accessibilityRole="button">
                  <Card style={styles.medCard}>
                    <Pilule teinte={m.teinte} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medNom}>{m.nom}</Text>
                      <Text style={styles.medDosage}>{m.dosage}</Text>
                      <Text style={styles.medPoso}>{m.posologie}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.brandDeep} />
                  </Card>
                </Pressable>
              ))}
            <BoutonAjout onPress={ajouter} />
          </>
        )}

        {onglet === 'medicaments' && (
          <>
            <Recherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Rechercher un médicament ..."
            />
            {meds.map((m) => (
              <Pressable key={m.id} onPress={() => ouvrirMed(m.id)} accessibilityRole="button">
                <Card style={styles.medCard}>
                  <Pilule teinte={m.teinte} />
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <View style={styles.sectionRow}>
                      <Text style={[styles.medNom, { flex: 1 }]}>{m.nom}</Text>
                      <StatutBadge statut={m.statut} />
                    </View>
                    <Text style={styles.medDosage}>{m.dosage}</Text>
                    <View style={styles.divider} />
                    <View style={styles.prises}>
                      <Prise label="Matin" icone="snow-outline" actif={m.prises.matin} />
                      <Prise label="Midi" icone="snow-outline" actif={m.prises.midi} />
                      <Prise label="Soir" icone="moon-outline" actif={m.prises.soir} />
                    </View>
                    <View style={styles.sectionRow}>
                      <Ionicons name="calendar-outline" size={14} color={colors.brandDeep} />
                      <Text style={styles.medPoso}>{m.duree}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.brandDeep} />
                </Card>
              </Pressable>
            ))}

            {stockFaible && (
              <View style={styles.stock}>
                <Ionicons name="alert-circle-outline" size={22} color={colors.brandDeep} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.stockTitre}>Stock faible</Text>
                  <Text style={styles.stockTexte}>
                    Il vous restent moins de 5 comprimés de {stockFaible.nom.toLowerCase()}
                  </Text>
                </View>
              </View>
            )}
            <BoutonAjout onPress={ajouter} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
function joursRestants(expireLe: string): number {
  const [j, m, a] = expireLe.split('/').map(Number);
  const fin = new Date(a, m - 1, j);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.round((fin.getTime() - auj.getTime()) / 86400000);
}

function ExpirationBadge({ expireLe }: { expireLe: string }) {
  const jours = joursRestants(expireLe);
  const s = Math.abs(jours) > 1 ? 's' : '';
  let texte = `Expire dans ${jours} jour${s}`;
  let fond: string = colors.tintMint;
  let couleur: string = colors.successDeep;

  if (jours < 0) {
    texte = `Expirée depuis ${-jours} jour${s}`;
    fond = colors.tintDanger;
    couleur = colors.danger;
  } else if (jours === 0) {
    texte = "Expire aujourd'hui";
    fond = colors.tintWarning;
    couleur = '#92400E';
  } else if (jours <= 7) {
    fond = colors.tintWarning;
    couleur = '#92400E';
  }

  return (
    <View style={[styles.badge, { backgroundColor: fond, alignSelf: 'flex-start' }]}>
      <Text style={[styles.badgeText, { color: couleur }]}>{texte}</Text>
    </View>
  );
}
function Recherche({
  valeur,
  onChange,
  placeholder,
}: {
  valeur: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.search}>
      <Ionicons name="search" size={16} color={colors.brandDeep} />
      <TextInput
        value={valeur}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textLabel}
        style={styles.searchInput}
        accessibilityLabel={placeholder}
      />
    </View>
  );
}

function Miniature({ grande, uri }: { grande?: boolean; uri?: string }) {
  const taille = grande ? 72 : 64;
  return (
    <View style={[styles.miniature, { width: taille, height: taille, overflow: 'hidden' }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: taille, height: taille }} />
      ) : (
        <Ionicons name="document-text-outline" size={taille / 2} color={colors.textLabel} />
      )}
    </View>
  );
}

function AncienneCard({ ordonnance, onVoir }: { ordonnance: Ordonnance; onVoir: () => void }) {
  return (
    <Card style={styles.ancienne}>
      <Miniature uri={ordonnance.photoUri} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={styles.ancienneTitre}>Ordonnance du {ordonnance.delivreeLe}</Text>
        <View style={styles.sectionRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textLabel} />
          <Text style={styles.medPoso}>Expire le {ordonnance.expireLe}</Text>
        </View>
      </View>
      <Pressable onPress={onVoir} accessibilityRole="button" style={styles.voirBtn}>
        <Text style={styles.voirText}>Voir</Text>
        <Ionicons name="chevron-forward" size={12} color={colors.successDeep} />
      </Pressable>
    </Card>
  );
}

function Pilule({ teinte }: { teinte: Medicament['teinte'] }) {
  const [a, b] = PILULE[teinte];
  return (
    <View style={styles.pilule}>
      <View
        style={[
          styles.piluleMoitie,
          { backgroundColor: a, borderTopLeftRadius: 14, borderBottomLeftRadius: 14 },
        ]}
      />
      <View
        style={[
          styles.piluleMoitie,
          { backgroundColor: b, borderTopRightRadius: 14, borderBottomRightRadius: 14 },
        ]}
      />
    </View>
  );
}

function StatutBadge({ statut }: { statut: Medicament['statut'] }) {
  const enCours = statut === 'en-cours';
  return (
    <View
      style={[styles.badge, { backgroundColor: enCours ? colors.tintMint : colors.tintViolet }]}>
      <Text style={[styles.badgeText, { color: enCours ? colors.successDeep : '#5B21B6' }]}>
        {enCours ? '• En cours' : 'Bientôt fini'}
      </Text>
    </View>
  );
}

function Prise({
  label,
  icone,
  actif,
}: {
  label: string;
  icone: keyof typeof Ionicons.glyphMap;
  actif: boolean;
}) {
  const couleur = actif ? colors.brandDeep : colors.neutral;
  return (
    <View style={styles.prise}>
      <Ionicons name={icone} size={13} color={couleur} />
      <Text style={[styles.priseText, { color: actif ? colors.textLabel : colors.neutral }]}>
        {label}
      </Text>
    </View>
  );
}

function BoutonAjout({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.addBtn}>
      <Ionicons name="add" size={22} color={colors.white} />
      <Text style={styles.addText}>Ajouter un médicament</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.pageBackground },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
  subtitle: { marginTop: spacing.xs, marginLeft: 56, fontSize: fontSize.sm, color: colors.textLabel },

  section: { gap: spacing.sm },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.brandDeep },

  badge: { paddingHorizontal: spacing.sm + 2, paddingVertical: 3, borderRadius: radius.pill },
  badgeText: { fontSize: fontSize.xs, fontWeight: '600' },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.tintBlue,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: fontSize.sm, color: colors.text },

  miniature: {
    borderRadius: radius.sm,
    backgroundColor: colors.tintSky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  activeInfo: { flex: 1, gap: spacing.sm },
  body: { fontSize: fontSize.sm, color: colors.text },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  link: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDeep },

  ancienne: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ancienneTitre: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  voirBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.tintMint,
    borderWidth: 1,
    borderColor: colors.successDeep,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: 6,
  },
  voirText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.successDeep },

  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.tintBlue,
    borderWidth: 1.5,
    borderColor: colors.brand,
  },
  scanText: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDeep },

  detailCard: { gap: spacing.md },
  detailTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.brandDeep },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.brandDeep,
    backgroundColor: colors.white,
  },
  photoBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },

  medCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medNom: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  medDosage: { fontSize: fontSize.sm, color: colors.brand, fontWeight: '600' },
  medPoso: { fontSize: fontSize.xs, color: colors.textLabel },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.neutral },
  prises: { flexDirection: 'row', gap: spacing.md },
  prise: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  priseText: { fontSize: fontSize.xs },

  pilule: { flexDirection: 'row', width: 56, height: 28, transform: [{ rotate: '-35deg' }] },
  piluleMoitie: { flex: 1 },

  stock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.tintMint,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stockTitre: { fontSize: fontSize.sm, fontWeight: '700', color: colors.brandDeep },
  stockTexte: { fontSize: fontSize.xs, color: colors.successDeep },

  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.brandDeep,
  },
  addText: { fontSize: fontSize.md, fontWeight: '700', color: colors.white },
  renewBtn: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: spacing.xs,
  paddingVertical: spacing.sm,
  borderRadius: radius.pill,
  backgroundColor: colors.brandDeep,
},
renewText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
});