'use client';

// Swipe the change card left to reject, right to approve. Pointer Events only: no gesture
// library, and the three buttons below stay the primary, keyboard-reachable path. The card
// starts moving only after 10px of horizontal travel, so clicking a diff line still works.
import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/components/ui';
import { useT } from '@/i18n/client';

const THRESHOLD = 88;
const MAX_OFFSET = 220;
const START_DISTANCE = 10;

/** Pure so the threshold can be unit tested without a pointer. */
export function resolveSwipe(dx: number, threshold = THRESHOLD): 'approve' | 'reject' | null {
  if (dx >= threshold) return 'approve';
  if (dx <= -threshold) return 'reject';
  return null;
}

export function SwipeDecide({
  enabled,
  onApprove,
  onReject,
  children,
}: {
  enabled: boolean;
  onApprove: () => void;
  onReject: () => void;
  children: ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const t = useT();
  const dxRef = useRef(0);
  const gesture = useRef<{ id: number; x: number; y: number; active: boolean } | null>(null);
  const dragged = useRef(false);

  const reset = () => {
    gesture.current = null;
    dxRef.current = 0;
    setDx(0);
    setDragging(false);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!enabled || e.button !== 0) return;
    dragged.current = false;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, active: false };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;

    const moveX = e.clientX - g.x;
    const moveY = e.clientY - g.y;

    if (!g.active) {
      if (Math.abs(moveX) < START_DISTANCE) return;
      // A mostly vertical gesture is a scroll, not a swipe. Let the page have it.
      if (Math.abs(moveX) <= Math.abs(moveY)) {
        gesture.current = null;
        return;
      }
      g.active = true;
      dragged.current = true;
      setDragging(true);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    const next = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, moveX));
    dxRef.current = next;
    setDx(next);
  };

  const finish = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;

    const wasActive = g.active;
    const result = resolveSwipe(dxRef.current);
    reset();
    if (!wasActive) return;
    if (result === 'approve') onApprove();
    else if (result === 'reject') onReject();
  };

  const strength = Math.min(1, Math.abs(dx) / THRESHOLD);
  const approve = dx > 0;

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          'relative touch-pan-y',
          enabled && 'cursor-grab active:cursor-grabbing',
          dragging && 'select-none',
        )}
        style={{
          transform: `translateX(${dx}px) rotate(${dx / 40}deg)`,
          transition: dragging ? 'none' : 'transform 220ms ease-out',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finish}
        onPointerCancel={reset}
        onClickCapture={(e) => {
          // A drag that happened to end over a diff line must not also open its note.
          if (dragged.current) {
            e.preventDefault();
            e.stopPropagation();
            dragged.current = false;
          }
        }}
      >
        {children}

        {enabled && dx !== 0 ? (
          <div
            aria-hidden
            className={cn(
              'pointer-events-none absolute inset-0 flex items-center justify-center rounded-blob',
              approve ? 'bg-mint/20' : 'bg-coral/20',
            )}
            style={{ opacity: strength }}
          >
            <span
              className={cn(
                'flex items-center gap-1.5 rounded-pill border-2 border-line px-3 py-1 font-display text-sm font-bold shadow-sticker-sm',
                approve ? 'bg-mint' : 'bg-coral',
              )}
            >
              {approve ? <ArrowRight className="h-4 w-4" aria-hidden /> : <ArrowLeft className="h-4 w-4" aria-hidden />}
              {approve ? t.scenarios.ship.approve : t.scenarios.ship.reject}
            </span>
          </div>
        ) : null}
      </div>

      {enabled ? (
        <p className="mt-1 text-center text-xs text-ink-soft">{t.scenarios.ship.swipeHint}</p>
      ) : null}
    </div>
  );
}
