import { Trophy } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { LeaderboardWidget } from './components/leaderboard-widget';

export const leaderboardManifest: ModuleManifest = {
  id: 'leaderboard',
  name: 'Leaderboard & course race',
  description: 'Weekly and all-time XP rankings, class boards and a transparent course race.',
  navItems: [
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['learner', 'instructor'], order: 30 },
  ],
  homeWidgets: [
    { id: 'leaderboard.mini', roles: ['learner'], order: 30, size: 'half', component: LeaderboardWidget },
  ],
};
