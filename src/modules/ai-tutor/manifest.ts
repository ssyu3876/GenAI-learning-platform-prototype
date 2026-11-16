import { Sparkles } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { TutorLauncher } from './components/tutor-launcher';

export const aiTutorManifest: ModuleManifest = {
  id: 'ai-tutor',
  name: 'AI tutor',
  description: 'Ask Pip anything, with the current lesson as context.',
  navItems: [
    {
      href: '/tutor/insights',
      label: 'Tutor insights',
      icon: Sparkles,
      roles: ['instructor', 'admin'],
      order: 75,
    },
  ],
  shellAddons: [TutorLauncher],
};
