// Contract for interactive activity types (quiz, sort, coding, role-play...).
// An activity type = zod config schema + a client Player component + hints for the AI
// course generator. Register new types in src/modules/activities/index.ts (or your own
// module) and they work everywhere: lesson player, studio editor/preview, AI generation.
import type { ComponentType } from 'react';
import type { ActivitySpec } from '@/core/content/draft';
import type { IconComponent } from '@/core/types';

export interface ActivityCompletion {
  /** 0-100 */
  score: number;
  /** Anything worth showing the instructor later (answers, feedback, transcript summary) */
  detail?: unknown;
}

export interface ActivityOutcome {
  xpGained: number;
  bestScore: number;
  leveledUp: boolean;
  levelName: string;
  lessonCompleted: boolean;
  courseCompleted: boolean;
}

export interface ActivityPlayerProps<C> {
  activity: { id: string; title: string; xpReward: number };
  config: C;
  /**
   * Call once when the learner finishes. In preview mode it resolves to null and nothing
   * is saved. Players should show their own result screen and allow "Try again".
   */
  onComplete: (result: ActivityCompletion) => Promise<ActivityOutcome | null>;
  previousBest?: number | null;
  /** true inside the studio editor: no XP, no saving */
  preview?: boolean;
}

export interface ActivityDefinition<C = unknown> extends ActivitySpec {
  /** Short description for the studio "add activity" menu */
  description: string;
  icon: IconComponent;
  defaultConfig: C;
  Player: ComponentType<ActivityPlayerProps<C>>;
  /**
   * Optional server-side scoring. Given the validated config and the `detail` the player
   * submitted, return the 0-100 score, or null when the detail does not fit the activity.
   * When a type has grade(), the lesson runner ignores the score sent by the browser.
   */
  grade?: (config: C, detail: unknown) => number | null;
}

/**
 * Type helper: checks a definition against its own config type, then widens it so it can
 * live in the shared ACTIVITY_TYPES list. The host validates config with `schema` before
 * rendering, so the widening is safe.
 */
export function defineActivity<C>(def: ActivityDefinition<C>): ActivityDefinition {
  return def as unknown as ActivityDefinition;
}
