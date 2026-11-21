import { useRouter } from 'expo-router';
import { OnboardingSlide } from '../../../features/onboarding/OnboardingSlide';

export default function Step1() {
  const router = useRouter();
  return (
    <OnboardingSlide
      step={0}
      eyebrow="VOTRE SANTÉ, SIMPLEMENT"
      title={'Ne manquez plus\njamais une prise'}
      description="Organisez vos traitements et recevez un rappel au bon moment, chaque jour."
      buttonTitle="Continuer"
      onNext={() => router.push('/(auth)/onboarding/step-2')}
      onSkip={() => router.replace('/(tabs)')}
    />
  );
}