import { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';

import { colors, spacing } from '@/theme';


import { AppHeader } from '../../../components/AppHeader';
import { LogoutButton } from '../../../components/LogoutButton';
import { MenuItem } from '../../../components/MenuItem';
import { MenuSection } from '../../../components/MenuSection';
import { ModeSwitch } from '../../../components/ModeSwitch';
import { UserCard } from '../../../components/UserCard';
import FollowedOverview from '@/components/FollowedOverview';

import { profilExtras } from '../constants';
import { useProfile } from '../hooks/useProfile';
import type { UsageMode } from '../types';

export default function ProfilScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [mode, setMode] = useState<UsageMode>('patient');
  const [appointmentReminder, setAppointmentReminder] = useState(false);

  const isAidant = mode === 'aidant';
  

  // Aidant : on choisit d'abord la personne suivie, puis on ouvre l'écran voulu
  const pickPerson = (target: 'medical' | 'rapport') =>
    router.push({ pathname: '/profil-choisir-personne', params: { target } } as unknown as Href);
const doLogout = () => {
  // TODO : vider la session (token, AsyncStorage, supabase.auth.signOut()...)
  router.replace('/login' as Href); // adapte selon le fichier dans (auth)
};

const onLogout = () => {
  if (Platform.OS === 'web') {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) doLogout();
    return;
  }
  Alert.alert('Se déconnecter', 'Voulez-vous vraiment vous déconnecter ?', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Se déconnecter', style: 'destructive', onPress: doLogout },
  ]);
};

  const reminderSwitch = (
    <Switch
      value={appointmentReminder}
      onValueChange={setAppointmentReminder}
      trackColor={{ false: profilExtras.switchOff, true: colors.success }}
      thumbColor="#FFFFFF"
    />
  );

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
        {!isAidant && (
          <MenuItem
            title="Profil médical"
            subtitle="Maladies, allergies, habitudes"
            icon="stats-chart-outline"
            onPress={() => router.push('/profil-medical' as Href)}
          />
        )}
        <MenuItem
  title="Notifications"
  subtitle="Rappels et alertes"
  icon="notifications-outline"
  onPress={() =>
    router.push({ pathname: '/profil-notifications', params: { mode } } as unknown as Href)
  }
  isLast={isAidant}
/>
        {!isAidant && (
          <MenuItem
            title="Confidentialité et sécurité"
            subtitle="Données et mot de passe"
            icon="shield-checkmark-outline"
            onPress={() => router.push('/profil-confidentialite' as Href)}
            isLast
          />
        )}
      </MenuSection>

      {isAidant ? <FollowedOverview /> : null}

      <MenuSection title="Suivi médical">
        {isAidant ? (
          <>
            <MenuItem
              title="Profil médical"
              subtitle="Choisir la personne suivie"
              icon="stats-chart-outline"
              onPress={() => pickPerson('medical')}
            />
            <MenuItem
              title="Rapport médical"
              subtitle="Choisir la personne, puis générer le rapport"
              icon="document-text-outline"
              onPress={() => pickPerson('rapport')}
            />
            <MenuItem
              title="Rappel rendez-vous de vos proches"
              subtitle={appointmentReminder ? 'Rappels activés pour vos proches' : 'Aucun rappel programmé'}
              icon="calendar-outline"
              tone="aidant"
              isLast
              trailing={reminderSwitch}
            />
          </>
        ) : (
          <>
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
              trailing={reminderSwitch}
            />
          </>
        )}
      </MenuSection>

      {!isAidant && (
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
      )}

      <View style={styles.logout}>
       <LogoutButton onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.md },
  logout: { marginTop: spacing.sm },
});