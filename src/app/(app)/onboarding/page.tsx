import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { OnboardingFlow } from '@/modules/onboarding/components/onboarding-flow';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.onboarding.title };
}

export default async function OnboardingPage() {
  const user = await requireUser(['learner']);
  return <OnboardingFlow name={user.name} />;
}
