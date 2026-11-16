import type { ComponentType, ReactNode } from 'react';
import type { UserRole } from './db/schema';

/** Return shape for every server action that does not redirect. */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarSeed: string;
}

// ---------------------------------------------------------------------------
// Module manifest: how a feature module plugs into the app shell.
// Every module exports one manifest from src/modules/<name>/manifest.ts and is listed
// once in src/registry/modules.ts. That is the only shared file you touch to add a module.
// ---------------------------------------------------------------------------

export type IconComponent = ComponentType<{ className?: string }>;

export interface NavItem {
  href: string;
  label: string;
  /** Any lucide-react icon, e.g. `icon: BookOpen` */
  icon: IconComponent;
  /** Optional unread/count indicator rendered after the label. */
  badge?: ComponentType;
  roles: UserRole[];
  /** Lower comes first. Core range: 0-99, modules: 100+ */
  order: number;
}

export interface HomeWidgetProps {
  user: SessionUser;
}

export interface HomeWidget {
  id: string;
  roles: UserRole[];
  order: number;
  /** "full" spans the whole row, "half" takes one column on wide screens */
  size: 'full' | 'half';
  component: ComponentType<HomeWidgetProps>;
}

export interface ShellAddonProps {
  user: SessionUser;
}

export interface ModuleManifest {
  /** kebab-case, same as the folder name */
  id: string;
  name: string;
  description: string;
  /** Team member responsible, shown on the admin "Modules" page */
  owner?: string;
  navItems?: NavItem[];
  homeWidgets?: HomeWidget[];
  /** Global UI mounted once in the app shell (e.g. a floating tutor button) */
  shellAddons?: ComponentType<ShellAddonProps>[];
}

export type WithChildren = { children: ReactNode };
