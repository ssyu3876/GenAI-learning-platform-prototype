import { BookOpen, LibraryBig } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { ContinueWidget } from './components/continue-widget';
import { LibraryWidget } from './components/library-widget';

export const coursesManifest: ModuleManifest = {
  id: 'courses',
  name: 'Course catalog & player',
  description: 'Browse mini-courses, enrol, and learn lesson by lesson.',
  navItems: [
    { href: '/courses', label: 'Courses', icon: BookOpen, roles: ['learner', 'admin'], order: 10 },
    { href: '/library', label: 'Library', icon: LibraryBig, roles: ['learner', 'instructor', 'admin'], order: 11 },
  ],
  homeWidgets: [
    { id: 'courses.continue', roles: ['learner'], order: 20, size: 'half', component: ContinueWidget },
    { id: 'courses.library', roles: ['learner', 'instructor', 'admin'], order: 15, size: 'full', component: LibraryWidget },
  ],
};
