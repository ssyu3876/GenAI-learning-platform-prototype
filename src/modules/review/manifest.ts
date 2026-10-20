import { NotebookPen } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { ReviewWidget } from './components/review-widget';

export const reviewManifest: ModuleManifest = {
  id: 'review',
  name: 'Mistake notebook & spaced review',
  description: 'Collects the quiz questions a learner missed and brings them back on a spaced schedule.',
  navItems: [
    { href: '/review', label: 'Review', icon: NotebookPen, roles: ['learner'], order: 25 },
  ],
  homeWidgets: [
    { id: 'review.due', roles: ['learner'], order: 25, size: 'half', component: ReviewWidget },
  ],
};
