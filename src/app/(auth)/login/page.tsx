import type { Metadata } from 'next';
import { getT } from '@/i18n';
import { LoginForm } from './login-form';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.chrome.auth.loginTitle };
}

export default function LoginPage() {
  return <LoginForm />;
}
