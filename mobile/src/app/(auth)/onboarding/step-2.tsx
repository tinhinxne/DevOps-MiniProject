import { useRouter } from 'expo-router';
import { OnboardingSlide } from '../../../features/onboarding/OnboardingSlide';

export default function Step2() {
  const router = useRouter();
  return (
    <OnboardingSlide
      step={1}
      eyebrow="UN SUIVI RASSURANT"
      title={'Gardez le rythme,\nsans y penser'}
      description="Visualisez vos prises en un coup d'œil et avancez sereinement dans votre traitement."
      buttonTitle="Continuer"
      onNext={() => router.push('/(auth)/onboarding/step-3')}
      onSkip={() => router.replace('/(tabs)')}
    />
  );
}