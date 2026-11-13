// Badge catalogue. Nothing is stored: a badge is a predicate over one snapshot of the
// learner's numbers, so it can never drift out of sync with the events table.
// Display copy (names, descriptions, group labels) lives in the i18n dictionaries and is
// looked up by `id` at render time; only ids and logic stay here.
import {
  Award,
  BookOpen,
  Brain,
  CalendarCheck,
  CalendarDays,
  CheckCheck,
  Compass,
  Crown,
  Crosshair,
  Flag,
  Flame,
  Gem,
  Layers,
  Leaf,
  Medal,
  MessageSquare,
  Mic,
  Repeat,
  Rocket,
  Shield,
  Ship,
  Skull,
  Sparkles,
  Sprout,
  Star,
  Swords,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Zap,
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
  /** Scenario keys finished at least once, e.g. 'ship-it', 'interview:hr'. */
  finishedScenarios: string[];
  /** Completed scenario runs, repeats included. */
  scenarioRuns: number;
  shipItBest: number;
  sprintBest: number;
  /** Agent Dungeon: cleared at all, the best tier cleared, and the best score. */
  dungeonCleared: boolean;
  dungeonBestTier: number;
  dungeonBest: number;
  /** Cleared a whole layer without taking damage. */
  dungeonFlawless: boolean;
  /** Cleared the seeded daily or weekly run, which is a harder board than a free run. */
  dungeonDaily: boolean;
  dungeonWeekly: boolean;
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

const did = (s: BadgeSnapshot, key: string) => s.finishedScenarios.includes(key);
const someInterview = (s: BadgeSnapshot) =>
  s.finishedScenarios.some((key) => key.startsWith('interview:'));

/**
 * 44 badges in three trails: what you learn, what you practise, and whether you keep coming
 * back.
 *
 * The learning thresholds follow the demo cohort (17 of 18 finish one activity, 14 reach ten,
 * 4 reach twenty-five, 13 finish a course, 5 score 100 once), so the early rungs fire early
 * and the late ones stay rare.
 *
 * Practice used to be one "finished a scenario" plus a combined ship-it/sprint-zero badge,
 * which stopped making sense once the scenarios became three different games. It is now a
 * ladder per scenario — finish, score 80, score 95 — plus the Agent Dungeon tiers, the
 * interview formats, and one badge for finishing all four ways to practise.
 */
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
    id: 'fifty-activities',
    group: 'learning',
    icon: Zap,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.activitiesCompleted, 50), need: 50 }),
    earned: (s) => s.activitiesCompleted >= 50,
  },
  {
    id: 'sixty-activities',
    group: 'learning',
    icon: Gem,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.activitiesCompleted, 60), need: 60 }),
    earned: (s) => s.activitiesCompleted >= 60,
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
    id: 'twenty-lessons',
    group: 'learning',
    icon: Layers,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.lessonsCompleted, 20), need: 20 }),
    earned: (s) => s.lessonsCompleted >= 20,
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
    id: 'perfect-ten',
    group: 'learning',
    icon: Crown,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.perfectActivities, 10), need: 10 }),
    earned: (s) => s.perfectActivities >= 10,
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
    id: 'two-courses',
    group: 'learning',
    icon: Trophy,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.coursesCompleted, 2), need: 2 }),
    earned: (s) => s.coursesCompleted >= 2,
  },
  {
    id: 'three-courses',
    group: 'learning',
    icon: Crown,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.coursesCompleted, 3), need: 3 }),
    earned: (s) => s.coursesCompleted >= 3,
  },

  // ---- practice: Ship It ----
  {
    id: 'first-scenario',
    group: 'practice',
    icon: Compass,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.finishedScenarios.length, 1), need: 1 }),
    earned: (s) => s.finishedScenarios.length >= 1,
  },
  {
    id: 'ship-it-finish',
    group: 'practice',
    icon: Ship,
    tint: 'sky',
    progress: (s) => ({ have: did(s, 'ship-it') ? 1 : 0, need: 1 }),
    earned: (s) => did(s, 'ship-it'),
  },
  {
    id: 'ship-it-high',
    group: 'practice',
    icon: Rocket,
    tint: 'sky',
    progress: (s) => ({ have: Math.min(s.shipItBest, 80), need: 80 }),
    earned: (s) => s.shipItBest >= 80,
  },
  {
    id: 'ship-it-ace',
    group: 'practice',
    icon: Crosshair,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.shipItBest, 95), need: 95 }),
    earned: (s) => s.shipItBest >= 95,
  },

  // ---- practice: Sprint Zero ----
  {
    id: 'sprint-zero-finish',
    group: 'practice',
    icon: Flag,
    tint: 'lilac',
    progress: (s) => ({ have: did(s, 'sprint-zero') ? 1 : 0, need: 1 }),
    earned: (s) => did(s, 'sprint-zero'),
  },
  {
    id: 'sprint-zero-high',
    group: 'practice',
    icon: Timer,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.sprintBest, 80), need: 80 }),
    earned: (s) => s.sprintBest >= 80,
  },

  // ---- practice: Agent Dungeon ----
  {
    id: 'dungeon-clear',
    group: 'practice',
    icon: Swords,
    tint: 'coral',
    progress: (s) => ({ have: s.dungeonCleared ? 1 : 0, need: 1 }),
    earned: (s) => s.dungeonCleared,
  },
  {
    id: 'dungeon-tier-3',
    group: 'practice',
    icon: Shield,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.dungeonBestTier, 3), need: 3 }),
    earned: (s) => s.dungeonBestTier >= 3,
  },
  {
    id: 'dungeon-tier-4',
    group: 'practice',
    icon: Shield,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.dungeonBestTier, 4), need: 4 }),
    earned: (s) => s.dungeonBestTier >= 4,
  },
  {
    id: 'dungeon-tier-5',
    group: 'practice',
    icon: Skull,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.dungeonBestTier, 5), need: 5 }),
    earned: (s) => s.dungeonBestTier >= 5,
  },
  {
    id: 'dungeon-score-80',
    group: 'practice',
    icon: Target,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.dungeonBest, 80), need: 80 }),
    earned: (s) => s.dungeonBest >= 80,
  },
  {
    id: 'dungeon-flawless',
    group: 'practice',
    icon: Sparkles,
    tint: 'mint',
    progress: (s) => ({ have: s.dungeonFlawless ? 1 : 0, need: 1 }),
    earned: (s) => s.dungeonFlawless,
  },
  {
    id: 'dungeon-daily',
    group: 'practice',
    icon: CalendarCheck,
    tint: 'lilac',
    progress: (s) => ({ have: s.dungeonDaily ? 1 : 0, need: 1 }),
    earned: (s) => s.dungeonDaily,
  },
  {
    id: 'dungeon-weekly',
    group: 'practice',
    icon: CalendarDays,
    tint: 'lilac',
    progress: (s) => ({ have: s.dungeonWeekly ? 1 : 0, need: 1 }),
    earned: (s) => s.dungeonWeekly,
  },

  // ---- practice: interviews ----
  {
    id: 'interviewed',
    group: 'practice',
    icon: MessageSquare,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.interviewsFinished, 1), need: 1 }),
    earned: (s) => s.interviewsFinished >= 1,
  },
  {
    id: 'interview-three',
    group: 'practice',
    icon: Mic,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.interviewsFinished, 3), need: 3 }),
    earned: (s) => s.interviewsFinished >= 3,
  },
  {
    id: 'interview-all',
    group: 'practice',
    icon: Brain,
    tint: 'lilac',
    progress: (s) => ({ have: Math.min(s.interviewsFinished, 7), need: 7 }),
    earned: (s) => s.interviewsFinished >= 7,
  },

  // ---- practice: across everything ----
  {
    id: 'all-scenarios',
    group: 'practice',
    icon: Award,
    tint: 'mint',
    // The four ways to practise: the two long stories, the dungeon, and any interview.
    progress: (s) => {
      const kinds = [did(s, 'ship-it'), did(s, 'sprint-zero'), did(s, 'agent-dungeon'), someInterview(s)];
      return { have: kinds.filter(Boolean).length, need: 4 };
    },
    earned: (s) =>
      did(s, 'ship-it') && did(s, 'sprint-zero') && did(s, 'agent-dungeon') && someInterview(s),
  },
  {
    id: 'scenario-runs-10',
    group: 'practice',
    icon: Repeat,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.scenarioRuns, 10), need: 10 }),
    earned: (s) => s.scenarioRuns >= 10,
  },

  {
    id: 'scenario-runs-25',
    group: 'practice',
    icon: Repeat,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.scenarioRuns, 25), need: 25 }),
    earned: (s) => s.scenarioRuns >= 25,
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
    id: 'streak-14',
    group: 'consistency',
    icon: CalendarCheck,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.streak, 14), need: 14 }),
    earned: (s) => s.streak >= 14,
  },
  {
    id: 'streak-30',
    group: 'consistency',
    icon: CalendarDays,
    tint: 'butter',
    progress: (s) => ({ have: Math.min(s.streak, 30), need: 30 }),
    earned: (s) => s.streak >= 30,
  },
  {
    id: 'stage-2',
    group: 'consistency',
    icon: Sprout,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.totalXp, 250), need: 250 }),
    earned: (s) => s.totalXp >= 250,
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
    icon: Gem,
    tint: 'mint',
    progress: (s) => ({ have: Math.min(s.totalXp, 2100), need: 2100 }),
    earned: (s) => s.totalXp >= 2100,
  },
  {
    id: 'xp-1500',
    group: 'consistency',
    icon: TrendingUp,
    tint: 'sky',
    progress: (s) => ({ have: Math.min(s.totalXp, 1500), need: 1500 }),
    earned: (s) => s.totalXp >= 1500,
  },
  {
    id: 'xp-3000',
    group: 'consistency',
    icon: TrendingUp,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.totalXp, 3000), need: 3000 }),
    earned: (s) => s.totalXp >= 3000,
  },
  {
    id: 'streak-60',
    group: 'consistency',
    icon: CalendarDays,
    tint: 'coral',
    progress: (s) => ({ have: Math.min(s.streak, 60), need: 60 }),
    earned: (s) => s.streak >= 60,
  },
];
export const GROUP_ORDER: BadgeGroup[] = ['learning', 'practice', 'consistency'];
