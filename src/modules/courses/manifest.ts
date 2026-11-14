import { BookOpen } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { ContinueWidget } from './components/continue-widget';

export const coursesManifest: ModuleManifest = {
  id: 'courses',
  name: 'Course catalog & player',
  description: 'Browse mini-courses, enrol, and learn lesson by lesson.',
  navItems: [
    { href: '/courses', label: 'Courses', icon: BookOpen, roles: ['learner', 'instructor'], order: 10 },
  ],
  homeWidgets: [
    { id: 'courses.continue', roles: ['learner'], order: 20, size: 'half', component: ContinueWidget },
  ],
};
