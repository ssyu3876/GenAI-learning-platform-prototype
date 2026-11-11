import { Rocket } from 'lucide-react';
import { defineActivity } from '@/core/activity-types';
import { releaseGameConfig } from '../../content/release-week';
import { ReleaseRunPlayer } from './player';
import { releaseRunSchema, type ReleaseRunConfig } from './schema';

/**
 * A compact three-week release simulation for course lessons. It is a fixed built-in game:
 * the config is generated from the Release Week content so the lesson page's normal content
 * localisation applies, and the player never talks to the server until it submits a score.
 */
export const releaseRunActivity = defineActivity<ReleaseRunConfig>({
  type: 'release-run',
  label: 'Release simulation',
  description: 'A short three-week release game: six decisions, four meters, one ending.',
  icon: Rocket,
  schema: releaseRunSchema,
  promptGuide:
    'Fixed simulation. Use the default config unchanged; the game content comes from the Release Week scenario.',
  defaultConfig: releaseGameConfig(),
  mock: () => releaseGameConfig(),
  Player: ReleaseRunPlayer,
});
