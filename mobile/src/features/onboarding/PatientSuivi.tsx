import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Button, Card, Input } from '../../components';
import { colors, fontSize, radius, spacing } from '../../theme';

type LinkedPatient = {
  id: string;
  name: string;
  relation: string;
};

// À remplacer plus tard par les vraies données (SQLite / API)
const LINKED_PATIENTS: LinkedPatient[] = [
  { id: '1', name: 'Camille Martin', relation: 'Sœur · Fratrie' },
  { id: '2', name: 'Louis Bernard', relation: 'Père · Parent' },
];

const RELATIONS = ['Parent', 'Conjoint(e)', 'Enfant', 'Fratrie', 'Ami(e)', 'Autre'];

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PatientSuivi() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [relation, setRelation] = useState('Parent');
  const [relationOpen, setRelationOpen] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const canSubmit = firstName.trim().length > 0 && lastName.trim().length > 0;

  const goNext = () => router.replace('/(tabs)');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    goNext(); // TODO: enregistrer le patient suivi avant de naviguer
  };

  const handleCreate = () => {
    if (!canSubmit) return;
    // TODO: créer le patient (SQLite / API) puis le définir comme patient suivi
    goNext();
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Lien "Passer" tout en haut (simple texte, pas un bouton) */}
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
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.title}>Patient suivi</Text>
          <Text style={styles.subtitle}>Choisissez la personne que vous accompagnez</Text>
        </View>

        {/* Bandeau info */}
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

        {/* Patients déjà liés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patients déjà liés</Text>
          <Text style={styles.sectionHint}>
            Sélectionnez un patient ou ajoutez-en un nouveau.
          </Text>

          {LINKED_PATIENTS.map((p) => {
            const selected = selectedId === p.id;
            return (
              <Pressable key={p.id} onPress={() => handleSelect(p.id)}>
                <Card style={[styles.patientCard, selected && styles.patientCardSelected]}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials(p.name)}</Text>
                  </View>
                  <View style={styles.patientInfo}>
                    <Text style={styles.patientName}>{p.name}</Text>
                    <Text style={styles.patientRelation}>{p.relation}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Ajouter un nouveau patient */}
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

        {/* Formulaire */}
        {showForm && (
          <Card style={styles.form}>
            <Text style={styles.formTitle}>Informations du patient</Text>
            <Text style={styles.formHint}>
              Ces informations permettent de personnaliser son suivi.
            </Text>

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

            {/* Lien avec le patient (liste déroulante simple) */}
            <View style={styles.relationBlock}>
              <Text style={styles.label}>Lien avec le patient</Text>
              <Pressable style={styles.select} onPress={() => setRelationOpen((v) => !v)}>
                <Text style={styles.selectText}>{relation}</Text>
                <Ionicons
                  name={relationOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textMuted}
                />
              </Pressable>
              {relationOpen && (
                <View style={styles.options}>
                  {RELATIONS.map((r) => (
                    <Pressable
                      key={r}
                      style={styles.option}
                      onPress={() => {
                        setRelation(r);
                        setRelationOpen(false);
                      }}
                    >
                      <Text style={[styles.optionText, r === relation && styles.optionActive]}>
                        {r}
                      </Text>
                      {r === relation && (
                        <Ionicons name="checkmark" size={16} color={colors.patient} />
                      )}
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <Input
              label="Date de naissance"
              placeholder="JJ/MM/AAAA"
              value={birthDate}
              onChangeText={setBirthDate}
              keyboardType="numbers-and-punctuation"
              leftIcon={<Ionicons name="calendar-outline" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Adresse e-mail"
              placeholder="patient@exemple.fr"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color={colors.textMuted} />}
            />

            <Input
              label="Téléphone"
              placeholder="06 00 00 00 00"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              leftIcon={<Ionicons name="call-outline" size={18} color={colors.textMuted} />}
            />

            <Button
              title="Créer et suivre ce patient"
              onPress={handleCreate}
              disabled={!canSubmit}
            />

            <Text style={styles.footnote}>
  {"Le patient sera notifié et pourra accéder à son propre espace s'il le souhaite."}
</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

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
  patientCardSelected: { borderWidth: 1.5, borderColor: colors.patient },
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
  formHint: { color: colors.textMuted, fontSize: fontSize.sm },
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

  footnote: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});