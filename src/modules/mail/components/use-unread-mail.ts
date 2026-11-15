'use client';

// Unread count for the shell navigation badge. The SSE stream is the primary source;
// polling is only a fallback when a stream cannot stay open.
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getUnreadMailCount } from '../actions';

export function useUnreadMail(): number {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let alive = true;
    let source: EventSource | null = null;
    let pollTimer: number | undefined;

    const apply = (count: number) => {
      if (alive && Number.isFinite(count)) setUnread(Math.max(0, count));
    };
    const poll = () => {
      getUnreadMailCount()
        .then(apply)
        .catch(() => {
          /* keep the last known count */
        });
    };
    const startPolling = () => {
      if (pollTimer) return;
      poll();
      pollTimer = window.setInterval(poll, 30_000);
    };

    try {
      source = new EventSource('/api/mail/stream');
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { count?: number };
          if (typeof data.count === 'number') apply(data.count);
        } catch {
          /* ignore malformed frames */
        }
      };
      source.onerror = () => {
        source?.close();
        source = null;
        startPolling();
      };
    } catch {
      startPolling();
    }

    window.addEventListener('focus', poll);
    return () => {
      alive = false;
      source?.close();
      if (pollTimer) window.clearInterval(pollTimer);
      window.removeEventListener('focus', poll);
    };
  }, [pathname]);

  return unread;
}
