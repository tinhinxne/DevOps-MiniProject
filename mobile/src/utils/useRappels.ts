import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { ApiError, listerTraitements } from './api';
import type { TraitementApi } from './api';
import {
  definirStatut,
  dosesDuJour,
  etatDose,
  lireStatuts,
  planifierRappels,
  viderRappels,
  ymdLocal,
} from './rappels';
import type { Dose, DoseEtat, StatutSaisi, Statuts } from './rappels';

// Charge les traitements + statuts à chaque retour sur l'écran, re-planifie les
// notifications et met l'heure à jour toutes les 30 s (une prise passe alors « À confirmer »).
export function useDoses() {
  const [traitements, setTraitements] = useState<TraitementApi[]>([]);
  const [statuts, setStatuts] = useState<Statuts>({});
  const [now, setNow] = useState(() => new Date());

  const recharger = useCallback(async () => {
    try {
      const t = await listerTraitements();
      setTraitements(t);
      setStatuts(await lireStatuts());
      await planifierRappels(t);
    } catch (e) {
      // token expiré ou patient non autorisé : on ne garde aucun rappel de ce compte
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        await viderRappels();
        setTraitements([]);
        setStatuts({});
      }
      // sinon : pas de patient sélectionné ou serveur injoignable, on ne touche à rien
    }
    setNow(new Date());
  }, []);

  useFocusEffect(
    useCallback(() => {
      recharger();
      const id = setInterval(() => setNow(new Date()), 30000);
      return () => clearInterval(id);
    }, [recharger]),
  );

  // hier + aujourd'hui (hier : pour ne pas perdre une prise jamais confirmée)
  const recentes: DoseEtat[] = useMemo(() => {
    const hier = new Date(now);
    hier.setDate(hier.getDate() - 1);
    return [...dosesDuJour(traitements, hier), ...dosesDuJour(traitements, now)].map((d) => ({
      ...d,
      ...etatDose(d, statuts[d.key], now),
    }));
  }, [traitements, statuts, now]);

  const aujourdhui = ymdLocal(now);
  const doses = useMemo(() => recentes.filter((d) => d.jour === aujourdhui), [recentes, aujourdhui]);
  const nbEnAttente = recentes.filter((d) => d.etat === 'EN_ATTENTE').length;

  const agir = useCallback(
    async (dose: Dose, statut: StatutSaisi) => {
      await definirStatut(dose, statut);
      setStatuts(await lireStatuts());
      setNow(new Date());
      await planifierRappels(traitements); // annule les relances de cette prise
    },
    [traitements],
  );

  return { traitements, doses, recentes, nbEnAttente, agir };
}