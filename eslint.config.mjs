import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

// Module boundary rule (see docs/standards/CODING_STANDARDS.md §2):
// - src/core never imports from modules, registry or app
// - a module never imports another module directly; it talks through core (events, tables)
//   or the registry
const MODULES = [
  'onboarding',
  'courses',
  'activities',
  'ai-tutor',
  'leaderboard',
  'studio',
  'classes',
  'self-learn',
  'admin',
  'review',
];

const moduleBoundaries = MODULES.map((name) => ({
  files: [`src/modules/${name}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: MODULES.filter((m) => m !== name).map((m) => `@/modules/${m}/**`),
            message:
              'Modules must not import each other. Use core services, the events table, or the registry.',
          },
          {
            group: ['@/app/**'],
            message: 'Modules must not import from src/app (routes are thin wrappers).',
          },
        ],
      },
    ],
  },
}));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ['src/core/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/**', '@/registry/**', '@/app/**'],
              message: 'core/ and components/ are the bottom layer and must not depend on features.',
            },
          ],
        },
      ],
    },
  },
  ...moduleBoundaries,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'drizzle/**', '.data/**']),
]);

export default eslintConfig;
