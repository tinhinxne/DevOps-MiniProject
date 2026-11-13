import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { colors, spacing } from '@/theme';
import { AppHeader } from '../components/AppHeader';
import { LogoutButton } from '../components/LogoutButton';
import { MenuItem } from '../components/MenuItem';
import { MenuSection } from '../components/MenuSection';
import { ModeSwitch } from '../components/ModeSwitch';
import { UserCard } from '../components/UserCard';
import { profilExtras } from '../constants';
import { useProfile } from '../hooks/useProfile';
import type { UsageMode } from '../types';

export default function ProfilScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [mode, setMode] = useState<UsageMode>('patient');
  const [appointmentReminder, setAppointmentReminder] = useState(false);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <AppHeader />

      {profile ? <UserCard profile={profile} /> : null}

      <ModeSwitch value={mode} onChange={setMode} />

      <MenuSection title="Mon compte">
        <MenuItem
          title="Informations personnelles"
          subtitle="Nom, date de naissance"
          icon="person-outline"
          onPress={() => router.push('/profil-informations' as Href)}
        />
        <MenuItem
          title="Profil médical"
          subtitle="Maladies, allergies, habitudes"
          icon="stats-chart-outline"
          onPress={() => router.push('/profil-medical' as Href)}
        />
        <MenuItem
          title="Notifications"
          subtitle="Rappels et alertes"
          icon="notifications-outline"
          onPress={() => router.push('/profil-notifications' as Href)}
        />
        <MenuItem
          title="Confidentialité et sécurité"
          subtitle="Données et mot de passe"
          icon="shield-checkmark-outline"
          onPress={() => router.push('/profil-confidentialite' as Href)}
          isLast
        />
      </MenuSection>

      <MenuSection title="Suivi médical">
        <MenuItem
          title="Rapport pour votre médecin"
          subtitle="Prises, oublis et observance des 30 derniers jours"
          icon="document-text-outline"
          onPress={() => router.push('/profil-rapport' as Href)}
        />
        <MenuItem
          title="Rappel rendez-vous"
          subtitle={appointmentReminder ? 'Rappel activé' : 'Aucun rappel programmé'}
          icon="calendar-outline"
          tone="aidant"
          isLast
          trailing={
            <Switch
              value={appointmentReminder}
              onValueChange={setAppointmentReminder}
              trackColor={{ false: profilExtras.switchOff, true: colors.success }}
              thumbColor="#FFFFFF"
            />
          }
        />
      </MenuSection>

      <MenuSection title="Espace aidant">
        {profile?.caregiver ? (
          <MenuItem
            title={profile.caregiver.name}
            subtitle="Reçoit vos alertes par e-mail"
            icon="heart-outline"
            tone="aidant"
            onPress={() => router.push('/profil-aidant' as Href)}
          />
        ) : null}
        <MenuItem
          title="Inviter un aidant par e-mail"
          icon="mail-outline"
          onPress={() => router.push('/profil-inviter-aidant' as Href)}
          isLast
        />
      </MenuSection>

      <View style={styles.logout}>
        <LogoutButton />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  logout: { marginTop: spacing.sm },
});