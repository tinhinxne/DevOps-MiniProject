import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';
import {
  addPatientsSuivis,
  getPatientsSuivis,
  LIENS,
  setSelectedPatient,
  type Lien,
  type Patient,
} from '../../utils/api';

const lienLabel = (l: Lien) => LIENS.find((x) => x.value === l)?.label ?? l;
const initials = (p: { prenom: string; nom: string }) =>
  `${p.prenom[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase();

export function PatientSuivi() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relation, setRelation] = useState<Lien>('PARENT');
  const [relationOpen, setRelationOpen] = useState(false);

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  useEffect(() => {
    getPatientsSuivis()
      .then((list) => {
        setPatients(list);
        setShowForm(list.length === 0);
      })
      .catch((e: any) => {
        if (e.code === 'TOKEN_INVALIDE') router.replace('/login');
        else setError(e.message || 'Impossible de charger les patients.');
      })
      .finally(() => setLoading(false));
  }, []);

  const goNext = () => router.replace('/(tabs)');

  // Choisir un patient existant : on le mémorise, le dashboard affichera son nom
  const handleSelect = async (p: Patient) => {
    await setSelectedPatient({ id: p.id, nom: p.nom, prenom: p.prenom });
    goNext();
  };

  // Créer un nouveau patient suivi, puis le choisir
  const handleCreate = async () => {
    if (!canSubmit || saving) return;
    setError('');
    setSaving(true);
    try {
      const created = await addPatientsSuivis([
        { prenom: firstName.trim(), nom: lastName.trim(), lien: relation },
      ]);
      await setSelectedPatient({
        id: created[0].id,
        nom: created[0].nom,
        prenom: created[0].prenom,
      });
      goNext();
    } catch (e: any) {
      setError(e.message || "Impossible d'ajouter le patient.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={goNext} hitSlop={12}>
          <Text style={styles.skip}>Passer</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Patient suivi</Text>
          <Text style={styles.subtitle}>Choisissez la personne que vous accompagnez</Text>
        </View>

        <Card style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="shield-checkmark" size={18} color={colors.patient} />
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Votre espace reste indépendant</Text>
            <Text style={styles.infoDesc}>
              Vous pouvez suivre ce patient tout en gardant votre propre espace médical.
            </Text>
          </View>
        </Card>

        {loading && <ActivityIndicator color={colors.patient} />}

        {patients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patients déjà liés</Text>
            <Text style={styles.sectionHint}>
              Sélectionnez un patient ou ajoutez-en un nouveau.
            </Text>

            {patients.map((p) => (
              <Pressable key={p.id} onPress={() => handleSelect(p)}>
                <Card style={styles.patientCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(p)}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>
                      {p.prenom} {p.nom}
                    </Text>
                    <Text style={styles.patientRelation}>{lienLabel(p.lien)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Card>
              </Pressable>
            ))}
          </View>
        )}

        {!loading && (
          <Pressable onPress={() => setShowForm((v) => !v)}>
            <Card style={styles.addCard}>
              <View style={styles.addIcon}>
                <Ionicons name="add" size={22} color={colors.patient} />
              </View>
              <View style={styles.patientInfo}>
                <Text style={styles.patientName}>Ajouter un nouveau patient</Text>
                <Text style={styles.patientRelation}>
                  Renseignez les informations du patient
                </Text>
              </View>
              <Ionicons
                name={showForm ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.textMuted}
              />
            </Card>
          </Pressable>
        )}

        {showForm && (
          <Card style={styles.form}>
            <Text style={styles.formTitle}>Informations du patient</Text>

            <View style={styles.row}>
              <View style={styles.flex}>
                <Input
                  label="Prénom"
                  placeholder="Camille"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>
              <View style={styles.flex}>
                <Input
                  label="Nom"
                  placeholder="Martin"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.relationBlock}>
              <Text style={styles.label}>Lien avec le patient</Text>
              <Pressable style={styles.select} onPress={() => setRelationOpen((v) => !v)}>
                <Text style={styles.selectText}>{lienLabel(relation)}</Text>
                <Ionicons
                  name={relationOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {relationOpen && (
                <View style={styles.options}>
                  {LIENS.map((l) => (
                    <Pressable
                      key={l.value}
                      style={styles.option}
                      onPress={() => {
                        setRelation(l.value);
                        setRelationOpen(false);
                      }}
                    >
                      <Text
                        style={[styles.optionText, l.value === relation && styles.optionActive]}
                      >
                        {l.label}
                      </Text>
                      {l.value === relation && (
                        <Ionicons name="checkmark" size={16} color={colors.patient} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Button
              title={saving ? 'Ajout...' : 'Créer et suivre ce patient'}
              onPress={handleCreate}
              disabled={!canSubmit || saving}
            />
          </Card>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default PatientSuivi;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F7FC' },
  flex: { flex: 1 },

  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skip: { color: colors.textMuted, fontSize: fontSize.md, fontWeight: '500' },

  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg * 2 },

  header: { gap: spacing.xs },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md },

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E3F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { flex: 1, gap: 2 },
  infoTitle: { color: colors.patient, fontSize: fontSize.md, fontWeight: '700' },
  infoDesc: { color: colors.textMuted, fontSize: fontSize.sm },

  section: { gap: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  sectionHint: { color: colors.textMuted, fontSize: fontSize.sm },

  patientCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.patient, fontWeight: '700', fontSize: fontSize.sm },
  patientInfo: { flex: 1, gap: 2 },
  patientName: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  patientRelation: { color: colors.textMuted, fontSize: fontSize.sm },

  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.patient,
    borderStyle: 'dashed',
  },
  addIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F0FB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  form: { gap: spacing.md },
  formTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  row: { flexDirection: 'row', gap: spacing.md },

  relationBlock: { gap: spacing.xs },
  label: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  selectText: { color: colors.text, fontSize: fontSize.md },
  options: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  optionText: { color: colors.text, fontSize: fontSize.md },
  optionActive: { color: colors.patient, fontWeight: '600' },

  error: { color: 'red', fontSize: fontSize.sm, textAlign: 'center' },
});