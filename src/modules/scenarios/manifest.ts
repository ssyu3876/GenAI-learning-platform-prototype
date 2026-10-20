import { Compass } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { ScenarioHubWidget } from './components/hub-widget';

export const scenariosManifest: ModuleManifest = {
  id: 'scenarios',
  name: 'Scenarios',
  description:
    'Long-form practice: supervise an AI agent, run a small team for three weeks, or sit a practice interview. Choices carry forward.',
  navItems: [
    { href: '/scenarios', label: 'Scenarios', icon: Compass, roles: ['learner', 'instructor', 'admin'], order: 100 },
  ],
  homeWidgets: [
    { id: 'scenarios.hub', roles: ['learner'], order: 25, size: 'half', component: ScenarioHubWidget },
  ],
};
