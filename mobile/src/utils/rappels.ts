import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { listerTraitements } from './api';
import type { TraitementApi } from './api';

// ---------------------------------------------------------------------
//  Réglages (écran Notifications) + statuts des prises, stockés sur le téléphone
// ---------------------------------------------------------------------
export type Reglages = {
  rappels: boolean; // rappels de prise activés
  son: boolean; // son et vibration
  resume: boolean; // résumé quotidien (21:00)
  delai: number; // minutes entre deux relances (et durée d'un report)
  nb: number; // nombre total de rappels avant l'arrêt
};

export const REGLAGES_DEFAUT: Reglages = { rappels: true, son: true, resume: false, delai: 10, nb: 3 };

export type StatutSaisi = 'PRIS' | 'OUBLIE' | 'REPORTE';
type Entree = { statut: StatutSaisi; jour: string; le: string; reporteJusqua?: string };
export type Statuts = Record<string, Entree>;
type Magasin = { reglages: Reglages; statuts: Statuts };

const FICHIER = `${FileSystem.documentDirectory}rappels.json`;

async function lire(): Promise<Magasin> {
  try {
    const info = await FileSystem.getInfoAsync(FICHIER);
    if (!info.exists) return { reglages: REGLAGES_DEFAUT, statuts: {} };
    const brut = JSON.parse(await FileSystem.readAsStringAsync(FICHIER));
    return { reglages: { ...REGLAGES_DEFAUT, ...brut.reglages }, statuts: brut.statuts ?? {} };
  } catch {
    return { reglages: REGLAGES_DEFAUT, statuts: {} };
  }
}

async function ecrire(m: Magasin) {
  await FileSystem.writeAsStringAsync(FICHIER, JSON.stringify(m));
}

export const lireReglages = async () => (await lire()).reglages;
export const lireStatuts = async () => (await lire()).statuts;

export async function sauverReglages(r: Reglages) {
  const m = await lire();
  await ecrire({ ...m, reglages: r });
}

// ---------------------------------------------------------------------
//  Calcul des prises prévues
// ---------------------------------------------------------------------
const pad = (n: number) => String(n).padStart(2, '0');
export const ymdLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

export type Dose = {
  key: string; // traitementId_AAAA-MM-JJ_HHMM
  traitementId: string;
  nom: string;
  dosage: string;
  quantite: number;
  heure: string; // HH:MM
  jour: string; // AAAA-MM-JJ
  date: Date;
};
export type EtatDose = 'A_VENIR' | 'EN_ATTENTE' | 'PRIS' | 'OUBLIE' | 'REPORTE';
export type DoseEtat = Dose & { etat: EtatDose; reporteJusqua?: Date };

// Toutes les prises d'un jour donné (traitement actif ce jour-là x ses rappels)
export function dosesDuJour(traitements: TraitementApi[], jour: Date): Dose[] {
  const d0 = new Date(jour);
  d0.setHours(0, 0, 0, 0);
  const j = ymdLocal(d0);

  return traitements
    .flatMap((t) => {
      const debut = new Date(`${t.dateDebut.slice(0, 10)}T00:00:00`);
      const fin = new Date(debut);
      fin.setDate(fin.getDate() + (t.dureeJours ?? 1) - 1);
      if (d0 < debut || d0 > fin) return [];

      return t.rappels.map((r): Dose => {
        const [h, m] = r.heure.split(':').map(Number);
        const date = new Date(d0);
        date.setHours(h, m, 0, 0);
        const heure = `${pad(h)}:${pad(m)}`;
        return {
          key: `${t.id}_${j}_${pad(h)}${pad(m)}`,
          traitementId: t.id,
          nom: t.nom,
          dosage: t.dosage ?? '',
          quantite: t.quantite ?? 1,
          heure,
          jour: j,
          date,
        };
      });
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

// État affiché d'une prise (tient compte de l'heure et des reports)
export function etatDose(dose: Dose, st: Entree | undefined, now: Date): { etat: EtatDose; reporteJusqua?: Date } {
  if (st?.statut === 'PRIS' || st?.statut === 'OUBLIE') return { etat: st.statut };
  if (st?.statut === 'REPORTE' && st.reporteJusqua) {
    const jusqua = new Date(st.reporteJusqua);
    if (jusqua > now) return { etat: 'REPORTE', reporteJusqua: jusqua };
    return { etat: 'EN_ATTENTE' }; // le report est terminé : il faut confirmer
  }
  return { etat: dose.date <= now ? 'EN_ATTENTE' : 'A_VENIR' };
}

// L'utilisateur confirme / reporte / signale un oubli
export async function definirStatut(dose: Dose, statut: StatutSaisi) {
  const m = await lire();
  const maintenant = new Date();
  m.statuts[dose.key] = {
    statut,
    jour: dose.jour,
    le: maintenant.toISOString(),
    reporteJusqua:
      statut === 'REPORTE'
        ? new Date(maintenant.getTime() + m.reglages.delai * 60000).toISOString()
        : undefined,
  };
  // on garde 14 jours d'historique local
  const limite = new Date();
  limite.setDate(limite.getDate() - 14);
  const lim = ymdLocal(limite);
  for (const k of Object.keys(m.statuts)) if (m.statuts[k].jour < lim) delete m.statuts[k];
  await ecrire(m);
}

// ---------------------------------------------------------------------
//  Notifications locales
// ---------------------------------------------------------------------
export async function initNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('rappels', {
      name: 'Rappels de prise',
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('rappels-silencieux', {
      name: 'Rappels silencieux',
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      enableVibrate: false,
    });
  }
}

async function permissionOk() {
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

const JOURS_PLANIFIES = 3; // on planifie 3 jours à l'avance, re-planifié à chaque ouverture
const MAX_PLANIFIEES = 60; // iOS limite à 64 notifications en attente

// Annule tout puis re-planifie : le résultat dépend uniquement des traitements,
// des statuts (PRIS/OUBLIE = plus de rappel, REPORTE = nouvelle heure) et des réglages.
async function planifier(traitements: TraitementApi[]) {
  try {
    await initNotifications();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { reglages, statuts } = await lire();
    if (!reglages.rappels && !reglages.resume) return;
    if (!(await permissionOk())) return;

    const channelId = reglages.son ? 'rappels' : 'rappels-silencieux';
    const maintenant = new Date();
    let compteur = 0;

    if (reglages.resume) {
      await Notifications.scheduleNotificationAsync({
        identifier: 'resume-quotidien',
        content: {
          title: 'Bilan de la journée',
          body: 'Ouvrez Maw3idi pour voir vos prises du jour.',
          sound: reglages.son,
        },
        // eslint-disable-next-line import/namespace
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 21, minute: 0, channelId },
      });
      compteur++;
    }

    if (!reglages.rappels) return;

    for (let i = 0; i < JOURS_PLANIFIES; i++) {
      const jour = new Date();
      jour.setDate(jour.getDate() + i);

      for (const dose of dosesDuJour(traitements, jour)) {
        const st = statuts[dose.key];
        if (st?.statut === 'PRIS' || st?.statut === 'OUBLIE') continue;

        const base =
          st?.statut === 'REPORTE' && st.reporteJusqua ? new Date(st.reporteJusqua) : dose.date;

        for (let k = 0; k < reglages.nb; k++) {
          const quand = new Date(base.getTime() + k * reglages.delai * 60000);
          if (quand <= maintenant) continue;
          if (compteur >= MAX_PLANIFIEES) return;

          await Notifications.scheduleNotificationAsync({
            identifier: `${dose.key}#${k}`,
            content: {
              title: k === 0 ? "C'est l'heure de votre médicament" : 'Prise non confirmée',
              body: `${dose.nom}${dose.dosage ? ` ${dose.dosage}` : ''} · ${dose.quantite} cp · ${dose.heure}`,
              sound: reglages.son,
              data: { doseKey: dose.key },
            },
            // eslint-disable-next-line import/namespace
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: quand, channelId },
          });
          compteur++;
        }
      }
    }
  } catch (e) {
    console.log('Planification des rappels impossible', e);
  }
}

// File d'attente : une seule planification à la fois (Home et la cloche peuvent l'appeler en même temps)
let enCours: Promise<void> = Promise.resolve();
export function planifierRappels(traitements: TraitementApi[]) {
  enCours = enCours.then(() => planifier(traitements));
  return enCours;
}

// Vide les notifications planifiées et les statuts (déconnexion, accès refusé). Garde les réglages.
export async function viderRappels() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const m = await lire();
    await ecrire({ reglages: m.reglages, statuts: {} });
  } catch {
    // rien à nettoyer
  }
}

// À appeler quand seuls les réglages changent
export async function replanifier() {
  try {
    await planifierRappels(await listerTraitements());
  } catch {
    // pas de patient sélectionné / serveur injoignable : on ne touche à rien
  }
}