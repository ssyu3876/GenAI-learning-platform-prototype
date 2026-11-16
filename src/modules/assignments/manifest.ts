import { ClipboardList } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';

export const assignmentsManifest: ModuleManifest = {
  id: 'assignments',
  name: 'Assignments',
  description: 'Graded quizzes, projects and written work attached to class course weeks.',
  navItems: [
    {
      href: '/assignments',
      label: 'Assignments',
      icon: ClipboardList,
      roles: ['learner', 'instructor', 'admin'],
      order: 42,
    },
  ],
};
