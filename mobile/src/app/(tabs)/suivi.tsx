// src/app/(tabs)/suivi.tsx
import { SuiviPrisesScreen } from '../../features/suivi/SuiviPrisesScreen';
export default function Suivi() {
  return <SuiviPrisesScreen mode="patient" />; // "aidant" quand le mode sera géré
}