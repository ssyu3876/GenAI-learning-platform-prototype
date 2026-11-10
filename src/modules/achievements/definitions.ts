// Badge catalogue. Nothing is stored: a badge is a predicate over one snapshot of the
// learner's numbers, so it can never drift out of sync with the events table.
// Display copy (names, descriptions, group labels) lives in the i18n dictionaries and is
// looked up by `id` at render time; only ids and logic stay here.
import {
  Award,
  BookOpen,
  Brain,
  CheckCheck,
  Compass,
  Flame,
  Leaf,
  Medal,
  MessageSquare,
  Ship,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import type { IconComponent } from '@/core/types';
import type { Tint } from '@/components/ui';
import type { Translations } from '@/i18n';

export type BadgeGroup = 'learning' | 'practice' | 'consistency';

/** Every badge needs a key in the `achievements.badges` dictionary. */
export type BadgeId = keyof Translations['achievements']['badges'];

export interface BadgeSnapshot {
  totalXp: number;
  level: number;
  streak: number;
  activitiesCompleted: number;
  perfectActivities: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  scenariosFinished: number;
  longScenariosFinished: number;
  shipItBest: number;
  sprintBest: number;
  interviewsFinished: number;
}

export interface BadgeDef {
  id: BadgeId;
  group: BadgeGroup;
  icon: IconComponent;
  tint: Tint;
  /** How close the learner is. `need` of 0 means it is a yes/no badge. */
  progress: (s: BadgeSnapshot) => { have: number; need: number };
  earned: (s: BadgeSnapshot) => boolean;
}

export const BADGES: BadgeDef[] = [
  // ---- learning ----
  {
    id: 'first-activity',
    group: 'learning',
    icon: Star,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.activitiesCompleted, 1), need: 1 }),
    earned: (s) => s.activitiesCompleted >= 1,
  },
  {
    id: 'ten-activities',
    group: 'learning',
    icon: Target,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.activitiesCompleted, 10), need: 10 }),
    earned: (s) => s.activitiesCompleted >= 10,
  },
  {
    id: 'twenty-five-activities',
    group: 'learning',
    icon: CheckCheck,
    tint: 'sky',
    progress: (s) => ({ have: Math.min(s.activitiesCompleted, 25), need: 25 }),
    earned: (s) => s.activitiesCompleted >= 25,
  },
  {
    id: 'perfect-one',
    group: 'learning',
    icon: Sparkles,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.perfectActivities, 1), need: 1 }),
    earned: (s) => s.perfectActivities >= 1,
  },
  {
    id: 'perfect-five',
    group: 'learning',
    icon: Medal,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.perfectActivities, 5), need: 5 }),
    earned: (s) => s.perfectActivities >= 5,
  },
  {
    id: 'first-lesson',
    group: 'learning',
    icon: BookOpen,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.lessonsCompleted, 1), need: 1 }),
    earned: (s) => s.lessonsCompleted >= 1,
  },
  {
    id: 'ten-lessons',
    group: 'learning',
    icon: BookOpen,
    tint: 'sky',
    progress: (s) => ({ have: Math.min(s.lessonsCompleted, 10), need: 10 }),
    earned: (s) => s.lessonsCompleted >= 10,
  },
  {
    id: 'first-course',
    group: 'learning',
    icon: Trophy,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.coursesCompleted, 1), need: 1 }),
    earned: (s) => s.coursesCompleted >= 1,
  },
  {
    id: 'three-courses',
    group: 'learning',
    icon: Trophy,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.coursesCompleted, 3), need: 3 }),
    earned: (s) => s.coursesCompleted >= 3,
  },

  // ---- practice ----
  {
    id: 'first-scenario',
    group: 'practice',
    icon: Compass,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.scenariosFinished, 1), need: 1 }),
    earned: (s) => s.scenariosFinished >= 1,
  },
  {
    id: 'both-long',
    group: 'practice',
    icon: Award,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.longScenariosFinished, 2), need: 2 }),
    earned: (s) => s.longScenariosFinished >= 2,
  },
  {
    id: 'clean-release',
    group: 'practice',
    icon: Ship,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.shipItBest, 80), need: 80 }),
    earned: (s) => s.shipItBest >= 80,
  },
  {
    id: 'still-standing',
    group: 'practice',
    icon: Users,
    tint: 'sky',
    progress: (s) => ({ have: Math.min(s.sprintBest, 80), need: 80 }),
    earned: (s) => s.sprintBest >= 80,
  },
  {
    id: 'interviewed',
    group: 'practice',
    icon: MessageSquare,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.interviewsFinished, 1), need: 1 }),
    earned: (s) => s.interviewsFinished >= 1,
  },
  {
    id: 'all-formats',
    group: 'practice',
    icon: Brain,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.interviewsFinished, 7), need: 7 }),
    earned: (s) => s.interviewsFinished >= 7,
  },

  // ---- consistency ----
  {
    id: 'streak-3',
    group: 'consistency',
    icon: Flame,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.streak, 3), need: 3 }),
    earned: (s) => s.streak >= 3,
  },
  {
    id: 'streak-7',
    group: 'consistency',
    icon: Flame,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.streak, 7), need: 7 }),
    earned: (s) => s.streak >= 7,
  },
  {
    id: 'stage-3',
    group: 'consistency',
    icon: Leaf,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.totalXp, 900), need: 900 }),
    earned: (s) => s.totalXp >= 900,
  },
  {
    id: 'stage-4',
    group: 'consistency',
    icon: Timer,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.totalXp, 2100), need: 2100 }),
    earned: (s) => s.totalXp >= 2100,
  },
];

export const GROUP_ORDER: BadgeGroup[] = ['learning', 'practice', 'consistency'];
