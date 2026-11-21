import { useRouter } from 'expo-router';
import { OnboardingSlide } from '../../../features/onboarding/OnboardingSlide';

export default function Step3() {
  const router = useRouter();
  return (
    <OnboardingSlide
      step={2}
      eyebrow="PRÊT À COMMENCER"
      title={'Votre routine santé\nvous attend'}
      description="Ajoutez votre premier médicament en quelques secondes. Nous nous occupons du reste."
      buttonTitle="Commencer"
      onNext={() => router.replace('/login')}
onSkip={() => router.replace('/login')}
    />
  );
}