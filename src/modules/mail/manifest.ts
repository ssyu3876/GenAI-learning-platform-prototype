import { Mail } from 'lucide-react';
import type { ModuleManifest } from '@/core/types';
import { MailNavBadge } from './components/mail-nav-badge';

export const mailManifest: ModuleManifest = {
  id: 'mail',
  name: 'Internal mail',
  description: 'Private messages between learners, instructors and admins.',
  navItems: [
    {
      href: '/mail',
      label: 'Mail',
      icon: Mail,
      badge: MailNavBadge,
      roles: ['learner', 'instructor', 'admin'],
      order: 40,
    },
  ],
};
