'use client';

import { fmt } from '@/i18n/format';
import { useT } from '@/i18n/client';
import { useUnreadMail } from './use-unread-mail';

export function MailNavBadge() {
  const t = useT();
  const unread = useUnreadMail();
  if (unread <= 0) return null;
  return (
    <span
      className="ml-auto grid h-5 min-w-5 animate-pulse place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-paper"
      aria-label={fmt(t.mail.unreadCount, { count: unread })}
      title={fmt(t.mail.unreadCount, { count: unread })}
    >
      {unread > 99 ? '99+' : unread}
    </span>
  );
}
