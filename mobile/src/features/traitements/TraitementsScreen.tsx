import { useCallback , useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Href, useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';

import { Card } from '@/components/Card';
import { SegmentedTabs } from '@/components/SegmentedTabs';
import { SubPageHeader } from '@/components/SubPageHeader';
import { colors, fontSize, radius, spacing } from '@/theme';
import {
  creerOrdonnance,
  listerOrdonnances,
  listerTraitements,
  renouvelerOrdonnance,
} from '@/utils/api';
import type { TraitementApi } from '@/utils/api';
import { ymd } from '@/utils/traitement';

import { Medicament, Ordonnance } from './mock';
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
const API_URL = process.env.EXPO_PUBLIC_API_URL;
let photoHeaders: Record<string, string> | undefined;
const imgSource = (uri: string) => ({
  uri,
  headers: uri.startsWith('http') ? photoHeaders : undefined,
});
const fr = (iso?: string | null) => {
  if (!iso) return '';
  const [a, m, j] = iso.slice(0, 10).split('-');
  return `${j}/${m}/${a}`;
};
const TEINTES: Medicament['teinte'][] = ['bleu', 'vert', 'violet'];

const versMedicament = (t: TraitementApi, i: number): Medicament => {
  const moments = t.rappels.map((r) => r.moment);
  return {
    id: t.id,
    ordonnanceId: t.ordonnanceId ?? '',
    nom: t.nom,
    dosage: t.dosage ?? '',
    posologie: t.frequence ?? '',
    prises: {
      matin: moments.some((m) => m === 'REVEIL' || m === 'PETIT_DEJ'),
      midi: moments.includes('DEJEUNER'),
      soir: moments.some((m) => m === 'DINER' || m === 'COUCHER'),
    },
    duree: t.dureeJours ? `Pendant ${t.dureeJours} jours` : '',
    statut: 'en-cours',
    stock: t.stockRestant ?? undefined,
    teinte: TEINTES[i % 3],
  };
};
type Periode = 'toutes' | '7j' | '30j' | '3m';

const PERIODES: { value: Periode; label: string; jours?: number }[] = [
  { value: 'toutes', label: 'Toutes' },
  { value: '7j', label: '7 jours', jours: 7 },
  { value: '30j', label: '30 jours', jours: 30 },
  { value: '3m', label: '3 mois', jours: 90 },
];
type Unite = 'jours' | 'semaines' | 'mois';

const UNITES: { value: Unite; label: string }[] = [
  { value: 'jours', label: 'Jours' },
  { value: 'semaines', label: 'Semaines' },
  { value: 'mois', label: 'Mois' },
];

// ajoute n jours / semaines / mois à une date
const ajouterDuree = (base: Date, n: number, u: Unite) => {
  const d = new Date(base);
  if (u === 'mois') d.setMonth(d.getMonth() + n);
  else d.setDate(d.getDate() + n * (u === 'semaines' ? 7 : 1));
  return d;
};

// nombre de jours écoulés depuis une date au format JJ/MM/AAAA
function joursDepuis(dateFr: string): number {
  const [j, m, a] = dateFr.split('/').map(Number);
  const d = new Date(a, m - 1, j);
  const auj = new Date();
  auj.setHours(0, 0, 0, 0);
  return Math.round((auj.getTime() - d.getTime()) / 86400000);
}

export function TraitementsScreen() {
  const router = useRouter();
  const [onglet, setOnglet] = useState<Onglet>('ordonnances');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [periode, setPeriode] = useState<Periode>('toutes');
  const [recherche, setRecherche] = useState('');
  const [liste, setListe] = useState<Ordonnance[]>([]);
  const [erreur, setErreur] = useState<string | null>(null);
  const [medicaments, setMedicaments] = useState<Medicament[]>([]);
  const [envoi, setEnvoi] = useState(false);
  const [photoOuverte, setPhotoOuverte] = useState(false);
  const [brouillon, setBrouillon] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [titre, setTitre] = useState('');
  const [note, setNote] = useState('');
 const [dureeNb, setDureeNb] = useState('1');
const [dureeUnite, setDureeUnite] = useState<Unite>('mois');
  const [renouvId, setRenouvId] = useState<string | null>(null);
  const [renouvNb, setRenouvNb] = useState('1');
  const [renouvUnite, setRenouvUnite] = useState<Unite>('mois');

  const charger = useCallback(async () => {
    try {
      setErreur(null);
      const token = await SecureStore.getItemAsync('token');
      photoHeaders = { Authorization: `Bearer ${token ?? ''}` };
      const data = await listerOrdonnances();
      setListe(
        data.map((o): Ordonnance => {
          const expireLe = fr(o.dateExpiration);
          return {
            id: o.id,
            titre: o.titre ?? '',
            note: o.note ?? '',
            delivreeLe: fr(o.dateEmission),
            expireLe,
            photoUri: `${API_URL}/ordonnances/${o.id}/photo`,
            // « en cours » = pas encore expirée
            statut: !expireLe || joursRestants(expireLe) >= 0 ? 'active' : 'ancienne',
          };
        }),
      );
      const trait = await listerTraitements();
      setMedicaments(trait.map(versMedicament));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Chargement impossible.');
    }
  }, []);

  // recharge à chaque fois que l'onglet reprend le focus
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const q = recherche.trim().toLowerCase();
  const maxJours = PERIODES.find((p) => p.value === periode)?.jours;
  const texte = (o: Ordonnance) =>
    `${o.titre ?? ''} ${o.note ?? ''} ordonnance du ${o.delivreeLe}`.toLowerCase();
  const actives = liste.filter((o) => o.statut === 'active' && texte(o).includes(q));
  const anciennes = liste.filter(
    (o) =>
      o.statut === 'ancienne' &&
      texte(o).includes(q) &&
      (maxJours === undefined || joursDepuis(o.delivreeLe) <= maxJours),
  );

  const origine = (ordonnanceId: string) => {
    const o = liste.find((x) => x.id === ordonnanceId);
    return o ? `Ordonnance : ${o.titre || `du ${o.delivreeLe}`}` : 'Saisie manuelle';
  };

  const meds = medicaments.filter((m) =>
    `${m.nom} ${origine(m.ordonnanceId)}`.toLowerCase().includes(q),
  );
  const stockFaible = medicaments.find((m) => m.stock !== undefined && m.stock < 5);
  const detail = liste.find((o) => o.id === detailId);

  // On transmet l'ordonnance affichée (UUID du serveur) jusqu'à /configurer-prise
   const ajouter = () =>
    router.push({
      pathname: '/ajout-med',
      params: detail ? { ordonnanceId: detail.id } : {},
    } as unknown as Href);

  const ouvrirMed = (id: string) =>
    router.push({ pathname: '/detail-medicament', params: { id } } as unknown as Href);

  // Étape 1 : prendre la photo (puis on affiche le formulaire)
  const photographier = async () => {
    if (envoi) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Caméra refusée',
        'Autorise la caméra dans les réglages pour photographier une ordonnance.',
      );
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      allowsEditing: true,
      base64: true,
    });
    if (res.canceled) return;
       setBrouillon(res.assets[0]);
    setTitre('');
    setNote('');
    setDureeNb('1');
    setDureeUnite('mois');
  
  };

  // Étape 2 : envoi au serveur
   const enregistrer = async () => {
    if (!brouillon || envoi) return;
    const n = parseInt(dureeNb, 10);
    if (!n || n < 1) {
      Alert.alert('Durée invalide', 'Saisis une durée supérieure à 0.');
      return;
    }
    const aujourdhui = new Date();
    const expire = ajouterDuree(aujourdhui, n, dureeUnite);
    const fmt = (d: Date) => d.toLocaleDateString('fr-FR');
    try {
      setEnvoi(true);
      const created = await creerOrdonnance({
        imageBase64: brouillon.base64 ?? '',
        dateEmission: ymd(aujourdhui),
        dateExpiration: ymd(expire),
        titre: titre.trim(),
        note: note.trim(),
      });
      const nouvelle: Ordonnance = {
        id: created.id,
        titre: titre.trim(),
        note: note.trim(),
        delivreeLe: fmt(aujourdhui),
        expireLe: fmt(expire),
        statut: 'active',
        photoUri: brouillon.uri,
      };
      setListe((l) => [nouvelle, ...l]); // on ne rétrograde plus les autres
      setBrouillon(null);
      setDetailId(nouvelle.id);
    } catch (e) {
      Alert.alert(
        'Envoi impossible',
        e instanceof Error ? e.message : "La photo n'a pas pu être enregistrée.",
      );
    } finally {
      setEnvoi(false);
    }
  };
    const ouvrirRenouvellement = (id: string) => {
    setRenouvNb('1');
    setRenouvUnite('mois');
    setRenouvId(id);
  };

  const confirmerRenouvellement = async () => {
    const n = parseInt(renouvNb, 10);
    if (!n || n < 1) {
      Alert.alert('Durée invalide', 'Saisis une durée supérieure à 0.');
      return;
    }
    if (!renouvId || envoi) return;
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    const nouvelleExpiration = ajouterDuree(base, n, renouvUnite);
    try {
      setEnvoi(true);
      await renouvelerOrdonnance(renouvId, ymd(nouvelleExpiration));
      setListe((l) =>
        l.map((x) =>
          x.id === renouvId
            ? { ...x, expireLe: fr(ymd(nouvelleExpiration)), statut: 'active' }
            : x,
        ),
      );
      setRenouvId(null);
    } catch (e) {
      Alert.alert(
        'Renouvellement impossible',
        e instanceof Error ? e.message : 'Réessaie plus tard.',
      );
    } finally {
      setEnvoi(false);
    }
  };

  const changerOnglet = (v: Onglet) => {
    setOnglet(v);
    setDetailId(null);
    setRecherche('');
    setPeriode('toutes');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View>
          <SubPageHeader title="Traitements" />
          <Text style={styles.subtitle}>Appuyez sur un médicament pour voir le détail.</Text>
        </View>

        <SegmentedTabs options={OPTIONS} value={onglet} onChange={changerOnglet} />
        {erreur && <Text style={{ color: colors.danger }}>{erreur}</Text>}

        {onglet === 'ordonnances' && brouillon && (
          <Card style={styles.detailCard}>
            <Text style={styles.detailTitle}>Nouvelle ordonnance</Text>
            <Miniature grande uri={brouillon.uri} />
            <TextInput
              value={titre}
              onChangeText={setTitre}
              placeholder="Titre (ex : Dr Benali – grippe)"
              placeholderTextColor={colors.textLabel}
              style={styles.input}
            />
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Note (facultatif)"
              multiline
              placeholderTextColor={colors.textLabel}
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            />
                       <Text style={styles.medPoso}>Valable pendant</Text>
            <DureeSaisie
              nb={dureeNb}
              unite={dureeUnite}
              onNb={setDureeNb}
              onUnite={setDureeUnite}
            />
            <Pressable
              onPress={enregistrer}
              disabled={envoi}
              accessibilityRole="button"
              style={[styles.addBtn, envoi && { opacity: 0.6 }]}>
              <Text style={styles.addText}>{envoi ? 'Envoi...' : 'Enregistrer'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setBrouillon(null)}
              accessibilityRole="button"
              style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>Annuler</Text>
            </Pressable>
          </Card>
        )}

        {onglet === 'ordonnances' && !detail && !brouillon && (
          <>
            <Recherche
              valeur={recherche}
              onChange={setRecherche}
              placeholder="Rechercher une ordonnance ..."
            />
            <View style={styles.chips}>
              {PERIODES.map((p) => (
                <Pressable
                  key={p.value}
                  onPress={() => setPeriode(p.value)}
                  accessibilityRole="button"
                  style={[styles.chip, periode === p.value && styles.chipActive]}>
                  <Text style={[styles.chipText, periode === p.value && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {actives.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionTitle}>Ordonnances en cours</Text>
                  <View style={[styles.badge, { backgroundColor: colors.tintMint }]}>
                    <Text style={[styles.badgeText, { color: colors.successDeep }]}>
                      • {actives.length} active{actives.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                {actives.map((o) => (
                  <Card key={o.id} style={styles.activeCard}>
                    <Miniature uri={o.photoUri} />
                    <View style={styles.activeInfo}>
                      {!!o.titre && <Text style={styles.ancienneTitre}>{o.titre}</Text>}
                      <Text style={styles.body}>Délivrée le {o.delivreeLe}</Text>
                      {!!o.expireLe && (
                        <>
                          <View
                            style={[
                              styles.badge,
                              { backgroundColor: colors.tintBlue, alignSelf: 'flex-start' },
                            ]}>
                            <Text style={[styles.badgeText, { color: colors.brandDeep }]}>
                              Valable jusqu&apos;au : {o.expireLe}
                            </Text>
                          </View>
                                                <ExpirationBadge expireLe={o.expireLe} />
                        </>
                      )}
                      <Pressable
                        onPress={() => setDetailId(o.id)}
                        accessibilityRole="button"
                        style={styles.linkRow}>
                        <Text style={styles.link}>Voir les détails</Text>
                        <Ionicons name="chevron-forward" size={14} color={colors.brandDeep} />
                      </Pressable>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionRow}>
                <Ionicons name="time-outline" size={18} color={colors.brandDeep} />
                <Text style={styles.sectionTitle}>Mes anciennes ordonnances</Text>
              </View>
              {anciennes.map((o) => (
                <AncienneCard
                  key={o.id}
                  ordonnance={o}
                  onVoir={() => setDetailId(o.id)}
                  onRenouveler={() => ouvrirRenouvellement(o.id)}
                />
              ))}
              {anciennes.length === 0 && (
                <Text style={styles.medPoso}>Aucune ordonnance pour cette période.</Text>
              )}
            </View>

            <Pressable
              style={[styles.scanBtn, envoi && { opacity: 0.6 }]}
              accessibilityRole="button"
              onPress={photographier}
              disabled={envoi}>
              <Ionicons name="camera-outline" size={20} color={colors.brandDeep} />
              <Text style={styles.scanText}>
                {envoi ? 'Envoi en cours...' : 'Photographier une ordonnance'}
              </Text>
            </Pressable>
          </>
        )}

        {onglet === 'ordonnances' && detail && !brouillon && (
          <>
            <Card style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                {detail.titre || `Ordonnance du ${detail.delivreeLe}`}
              </Text>
              {!!detail.note && <Text style={styles.body}>{detail.note}</Text>}
              <View style={styles.detailRow}>
                <Miniature grande uri={detail.photoUri} />
                <Pressable
                  style={styles.photoBtn}
                  accessibilityRole="button"
                  onPress={() => setPhotoOuverte(true)}>
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
                    <View style={styles.sectionRow}>
                      <Ionicons
                        name={m.ordonnanceId ? 'document-text-outline' : 'create-outline'}
                        size={14}
                        color={colors.textLabel}
                      />
                      <Text style={styles.medPoso}>{origine(m.ordonnanceId)}</Text>
                    </View>
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

      <Modal
        visible={photoOuverte}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOuverte(false)}>
        <Pressable style={styles.viewer} onPress={() => setPhotoOuverte(false)}>
          {detail?.photoUri && (
            <Image
              source={imgSource(detail.photoUri)}
              style={styles.viewerImg}
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>

      <Modal
        visible={!!renouvId}
        transparent
        animationType="fade"
        onRequestClose={() => setRenouvId(null)}>
        <View style={styles.overlay}>
          <Card style={styles.renewCard}>
            <Text style={styles.detailTitle}>Renouveler l&apos;ordonnance</Text>
            <Text style={styles.medPoso}>Pour combien de temps ?</Text>
            <DureeSaisie
              nb={renouvNb}
              unite={renouvUnite}
              onNb={setRenouvNb}
              onUnite={setRenouvUnite}
            />
            <Pressable
              onPress={confirmerRenouvellement}
              disabled={envoi}
              accessibilityRole="button"
              style={[styles.addBtn, envoi && { opacity: 0.6 }]}>
              <Text style={styles.addText}>{envoi ? 'Envoi...' : 'Renouveler'}</Text>
            </Pressable>
            <Pressable
              onPress={() => setRenouvId(null)}
              accessibilityRole="button"
              style={styles.photoBtn}>
              <Text style={styles.photoBtnText}>Annuler</Text>
            </Pressable>
          </Card>
        </View>
      </Modal>
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
  // key = uri : si l'adresse change, l'état interne est remis à zéro
  return <MiniatureImage key={uri ?? 'vide'} grande={grande} uri={uri} />;
}

function MiniatureImage({ grande, uri }: { grande?: boolean; uri?: string }) {
  const taille = grande ? 72 : 64;
  const [ko, setKo] = useState(false);
  const [essai, setEssai] = useState(0);

  return (
    <View style={[styles.miniature, { width: taille, height: taille, overflow: 'hidden' }]}>
      {uri && !ko ? (
        <Image
          key={essai}
          source={imgSource(uri)}
          style={{ width: taille, height: taille }}
          onError={(e) => {
            console.log('IMG KO', uri, e.nativeEvent.error);
            // un 2e essai automatique avant d'abandonner
            if (essai < 1) setEssai(essai + 1);
            else setKo(true);
          }}
        />
      ) : (
        <Ionicons name="document-text-outline" size={taille / 2} color={colors.textLabel} />
      )}
    </View>
  );
}
function AncienneCard({ ordonnance, onVoir, onRenouveler }: {
  ordonnance: Ordonnance; onVoir: () => void; onRenouveler: () => void;
}) {
  return (
    <Card style={styles.ancienne}>
      <Miniature uri={ordonnance.photoUri} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <Text style={styles.ancienneTitre}>
          {ordonnance.titre || `Ordonnance du ${ordonnance.delivreeLe}`}
        </Text>
        <View style={styles.sectionRow}>
          <Ionicons name="calendar-outline" size={14} color={colors.textLabel} />
          <Text style={styles.medPoso}>Expirée le {ordonnance.expireLe}</Text>
        </View>
        <Pressable onPress={onRenouveler} accessibilityRole="button" style={styles.renewBtn}>
          <Ionicons name="refresh" size={14} color={colors.white} />
          <Text style={styles.renewText}>Renouveler</Text>
        </Pressable>
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
function DureeSaisie({
  nb,
  unite,
  onNb,
  onUnite,
}: {
  nb: string;
  unite: Unite;
  onNb: (v: string) => void;
  onUnite: (u: Unite) => void;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <TextInput
        value={nb}
        onChangeText={(t) => onNb(t.replace(/[^0-9]/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="Ex : 5"
        placeholderTextColor={colors.textLabel}
        style={styles.input}
        accessibilityLabel="Durée"
      />
      <View style={styles.chips}>
        {UNITES.map((u) => (
          <Pressable
            key={u.value}
            onPress={() => onUnite(u.value)}
            accessibilityRole="button"
            style={[styles.chip, unite === u.value && styles.chipActive]}>
            <Text style={[styles.chipText, unite === u.value && styles.chipTextActive]}>
              {u.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  input: {
    backgroundColor: colors.tintBlue,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  chips: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.tintBlue,
  },
  chipActive: { backgroundColor: colors.brandDeep },
  chipText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.brandDeep },
  chipTextActive: { color: colors.white },

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

  viewer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center' },
  viewerImg: { width: '100%', height: '80%' },

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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  renewCard: { gap: spacing.md },
});