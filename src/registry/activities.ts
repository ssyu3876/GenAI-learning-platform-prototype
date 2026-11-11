// All activity types available in the app. Safe to import from client and server code.
// To add a type from your own module: export an ActivityDefinition from it and append it
// to ACTIVITY_TYPES below. Nothing else needs to change.
import type { ActivityDefinition } from '@/core/activity-types';
import type { ActivitySpec } from '@/core/content/draft';
import { coreActivityTypes } from '@/modules/activities';
import { scenarioActivityTypes } from '@/modules/scenarios/activities';

export const ACTIVITY_TYPES: ActivityDefinition[] = [...coreActivityTypes, ...scenarioActivityTypes];

const byType = new Map(ACTIVITY_TYPES.map((d) => [d.type, d]));

export function getActivityType(type: string): ActivityDefinition | undefined {
  return byType.get(type);
}

/** Specs passed to the AI course generator (core never imports activity code). */
export function activitySpecs(types?: string[]): ActivitySpec[] {
  return ACTIVITY_TYPES.filter((d) => !types || types.includes(d.type)).map((d) => ({
    type: d.type,
    label: d.label,
    promptGuide: d.promptGuide,
    schema: d.schema,
    mock: d.mock,
  }));
}
