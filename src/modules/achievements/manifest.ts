import { Award } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { GrowthWidget } from './components/growth-widget';

export const achievementsManifest: ModuleManifest = {
  id: 'achievements',
  name: 'Badges and growth',
  description:
    'Badges derived from the event log, plus the Pip growth journey: XP in, leaves out. Nothing is stored twice.',
  navItems: [
    { href: '/badges', label: 'Badges', icon: Award, roles: ['learner', 'instructor', 'admin'], order: 110 },
  ],
  homeWidgets: [
    { id: 'achievements.growth', roles: ['learner'], order: 26, size: 'half', component: GrowthWidget },
  ],
};
