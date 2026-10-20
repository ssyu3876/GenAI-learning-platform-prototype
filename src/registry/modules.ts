// The one list of feature modules. Adding a module = create src/modules/<name>/manifest.ts
// and add one line here. Removing a line removes its nav items, home widgets and addons.
// Server-side only (manifests reference server components).
import type { UserRole } from '@/core/db/schema';
import type { HomeWidget, ModuleManifest, NavItem, ShellAddonProps } from '@/core/types';
import type { ComponentType } from 'react';
import { activitiesManifest } from '@/modules/activities/manifest';
import { achievementsManifest } from '@/modules/achievements/manifest';
import { adminManifest } from '@/modules/admin/manifest';
import { aiTutorManifest } from '@/modules/ai-tutor/manifest';
import { classesManifest } from '@/modules/classes/manifest';
import { coursesManifest } from '@/modules/courses/manifest';
import { leaderboardManifest } from '@/modules/leaderboard/manifest';
import { onboardingManifest } from '@/modules/onboarding/manifest';
import { scenariosManifest } from '@/modules/scenarios/manifest';
import { selfLearnManifest } from '@/modules/self-learn/manifest';
import { studioManifest } from '@/modules/studio/manifest';

export const MODULES: ModuleManifest[] = [
  onboardingManifest,
  coursesManifest,
  activitiesManifest,
  selfLearnManifest,
  leaderboardManifest,
  aiTutorManifest,
  studioManifest,
  classesManifest,
  scenariosManifest,
  achievementsManifest,
  adminManifest,
];

export function navItemsFor(role: UserRole): NavItem[] {
  return MODULES.flatMap((m) => m.navItems ?? [])
    .filter((n) => n.roles.includes(role))
    .sort((a, b) => a.order - b.order);
}

export function homeWidgetsFor(role: UserRole): HomeWidget[] {
  return MODULES.flatMap((m) => m.homeWidgets ?? [])
    .filter((w) => w.roles.includes(role))
    .sort((a, b) => a.order - b.order);
}

export function shellAddons(): ComponentType<ShellAddonProps>[] {
  return MODULES.flatMap((m) => m.shellAddons ?? []);
}
