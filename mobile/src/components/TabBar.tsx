import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Fragment, useState } from 'react';
import type { ComponentProps } from 'react';
import type { Tabs } from 'expo-router';

import { colors } from '../theme';
import { AddSheet } from './AddSheet';

// Couleurs de la maquette (à ajuster avec les valeurs exactes de Figma)
const ACTIVE = colors.logoBlue;
const ACTIVE_SOFT = colors.tintBlue;
const INACTIVE = '#94A3B8'; 


const FAB_SIZE = 60;
const FAB_OVERLAP = 28; // de combien le bouton « + » dépasse au-dessus de la barre

type IconName = keyof typeof Ionicons.glyphMap;
// Type des props que Tabs envoie réellement à notre barre
type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  index: { label: 'Accueil', icon: 'home-outline', iconActive: 'home' },
  ordonnances: { label: 'Traitements', icon: 'bandage-outline', iconActive: 'bandage' },
  
  suivi: { label: 'Suivi', icon: 'stats-chart-outline', iconActive: 'stats-chart' },
  profil: { label: 'Moi', icon: 'person-outline', iconActive: 'person' },
};

export function TabBar({ state, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();

  const goTo = (routeKey: string, focused: boolean) => {
   if (!focused) navigateToTab(routeKey);
  };
 const [addOpen, setAddOpen] = useState(false);

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.bar}>
              {state.routes.map((route, index) => {
          const tab = TABS[route.name];
          if (!tab) return null;
          const focused = state.index === index;

          return (
            <Fragment key={route.key}>
              {/* Emplacement du « + » au milieu : seulement son libellé */}
              {index === 2 ? (
                <View style={styles.item}>
                  <View style={styles.fabSpace} />
                  <Text style={[styles.label, styles.labelAdd, addOpen && styles.labelActive]}>Ajouter</Text>
                </View>
              ) : null}

              <Pressable
                style={styles.item}
                onPress={() => goTo(route.key, focused)}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                accessibilityState={{ selected: focused }}
              >
                <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                  <Ionicons
                    name={focused ? tab.iconActive : tab.icon}
                    size={22}
                    color={focused ? ACTIVE : INACTIVE}
                  />
                </View>
                <Text style={[styles.label, focused && styles.labelActive]}>{tab.label}</Text>
              </Pressable>
            </Fragment>
          );
        })}
      </View>

      {/* Bouton « + » : posé au-dessus de la barre, dans la zone du wrapper (touches OK sur Android) */}
      <View pointerEvents="box-none" style={styles.fabHolder}>
        <Pressable
           onPress={() => setAddOpen(true)}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Ajouter"
        >
          <Ionicons name="add" size={34} color="#FFFFFF" />
        </Pressable>
      </View>

      <AddSheet visible={addOpen} onClose={() => setAddOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#EAF2FF',
    paddingTop: FAB_OVERLAP,
    paddingHorizontal: 10,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingBottom: 8,
    shadowColor: '#0F172A',
    shadowOpacity: 0.1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  iconWrap: {
    width: 40,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: ACTIVE_SOFT,
    shadowColor: ACTIVE,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  label: { fontSize: 11, color: INACTIVE, fontWeight: '500' },
  labelActive: { color: ACTIVE, fontWeight: '700' },
  labelAdd: { marginBottom: 0 },
  fabSpace: { height: FAB_SIZE - FAB_OVERLAP - 10 },
  fabHolder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: ACTIVE,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 12,
  },
});