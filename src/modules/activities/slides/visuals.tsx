'use client';

// Small diagrams for narrated slides. Deliberately word-free: the narration and captions
// carry the language, so one diagram works in English and Chinese without a second copy.
// Add a name here, then put it on a slide as `visual: 'name'`; unknown names are ignored.
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock,
  Link2,
  MapPin,
  Megaphone,
  Split,
  Target,
  Trophy,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { cn } from '@/components/ui';

export const SLIDE_VISUALS = ['impact-first', 'three-moves', 'trade-off', 'tone-meter', 'star-stack'] as const;
export type SlideVisualName = (typeof SLIDE_VISUALS)[number];

export function isSlideVisual(name: string): name is SlideVisualName {
  return (SLIDE_VISUALS as readonly string[]).includes(name);
}

/** A wall of grey lines: what jargon sounds like to someone outside the team. */
function JargonBlock() {
  return (
    <div className="flex flex-1 flex-col gap-1.5" aria-hidden>
      <span className="h-2 w-11/12 rounded-pill bg-ink/15" />
      <span className="h-2 w-2/3 rounded-pill bg-ink/15" />
      <span className="h-2 w-3/4 rounded-pill bg-ink/15" />
    </div>
  );
}

function ImpactFirst() {
  return (
    <div className="grid gap-2">
      <div className="flex items-center gap-3 rounded-blob border-2 border-line bg-cream px-4 py-3">
        <X className="h-5 w-5 shrink-0 text-coral-deep" aria-hidden />
        <JargonBlock />
      </div>
      <div className="flex items-center gap-3 rounded-blob border-2 border-line bg-mint-soft px-4 py-3">
        <Check className="h-5 w-5 shrink-0 text-mint-deep" aria-hidden />
        <span className="font-display text-xl font-bold">12s</span>
        <ArrowRight className="h-4 w-4 text-ink-soft" aria-hidden />
        <span className="font-display text-xl font-bold">2s</span>
        <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <Clock className="h-3.5 w-3.5" aria-hidden /> 9–10
        </span>
      </div>
    </div>
  );
}

const MOVES = [
  { icon: Megaphone, tone: 'bg-coral-soft' },
  { icon: Link2, tone: 'bg-butter-soft' },
  { icon: Split, tone: 'bg-sky-soft' },
] as const;

function ThreeMoves() {
  return (
    <div className="flex items-stretch gap-2">
      {MOVES.map(({ icon: Icon, tone }, i) => (
        <div key={i} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              'flex flex-1 items-center gap-2 rounded-blob border-2 border-line px-3 py-2',
              tone,
            )}
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 border-line bg-paper font-display text-xs font-bold">
              {i + 1}
            </span>
            <Icon className="h-4 w-4 text-ink" aria-hidden />
          </div>
          {i < MOVES.length - 1 ? (
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function TradeOff() {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <div className="flex items-center gap-3 rounded-blob border-2 border-line bg-paper px-4 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line bg-sky-soft font-display text-sm font-bold">
          A
        </span>
        <Zap className="h-4 w-4 text-ink-soft" aria-hidden />
        <span className="font-display text-lg font-bold">+0d</span>
        <X className="ml-auto h-4 w-4 text-coral-deep" aria-hidden />
      </div>
      <div className="flex items-center gap-3 rounded-blob border-2 border-line bg-mint-soft px-4 py-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 border-line bg-paper font-display text-sm font-bold">
          B
        </span>
        <Clock className="h-4 w-4 text-ink-soft" aria-hidden />
        <span className="font-display text-lg font-bold">+2d</span>
        <Check className="ml-auto h-4 w-4 text-mint-deep" aria-hidden />
      </div>
    </div>
  );
}

/** Two versions of the same comment, with the needle sitting on the useful side. */
function ToneMeter() {
  return (
    <div className="grid gap-3">
      <div className="flex items-stretch gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-blob border-2 border-line bg-cream px-3 py-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-coral-deep" aria-hidden />
          <div className="flex flex-1 flex-col gap-1.5" aria-hidden>
            <span className="h-2 w-11/12 rounded-pill bg-ink/20" />
            <span className="h-2 w-2/3 rounded-pill bg-ink/15" />
          </div>
          <X className="h-4 w-4 shrink-0 text-coral-deep" aria-hidden />
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-blob border-2 border-line bg-mint-soft px-3 py-2">
          <Check className="h-4 w-4 shrink-0 text-mint-deep" aria-hidden />
          <div className="flex flex-1 flex-col gap-1.5" aria-hidden>
            <span className="h-2 w-3/4 rounded-pill bg-ink/30" />
            <span className="h-2 w-1/2 rounded-pill bg-ink/20" />
          </div>
          <Check className="h-4 w-4 shrink-0 text-mint-deep" aria-hidden />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-coral-deep" aria-hidden />
        <div className="relative h-3 flex-1 overflow-hidden rounded-pill border-2 border-line bg-paper" aria-hidden>
          <span className="absolute inset-y-0 left-0 w-1/3 bg-coral" />
          <span className="absolute inset-y-0 left-1/3 w-1/3 bg-butter" />
          <span className="absolute inset-y-0 right-0 w-1/3 bg-mint" />
          <span className="absolute top-1/2 left-[68%] h-5 w-1 -translate-y-1/2 rounded-pill bg-line" />
        </div>
        <Check className="h-4 w-4 shrink-0 text-mint-deep" aria-hidden />
      </div>
    </div>
  );
}

const STAR_BOXES = [
  { letter: 'S', icon: MapPin, tone: 'bg-coral-soft' },
  { letter: 'T', icon: Target, tone: 'bg-butter-soft' },
  { letter: 'A', icon: Wrench, tone: 'bg-sky-soft' },
  { letter: 'R', icon: Trophy, tone: 'bg-mint-soft' },
] as const;

/** The four STAR boxes, in order. The letters are the same in both languages. */
function StarStack() {
  return (
    <div className="flex items-stretch gap-2">
      {STAR_BOXES.map(({ letter, icon: Icon, tone }, i) => (
        <div key={letter} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-blob border-2 border-line px-2 py-3',
              tone,
            )}
          >
            <span className="font-display text-xl leading-none font-bold">{letter}</span>
            <Icon className="h-5 w-5 text-ink" aria-hidden />
          </div>
          {i < STAR_BOXES.length - 1 ? (
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
          ) : null}
        </div>
      ))}
    </div>
  );
}

const VISUALS: Record<SlideVisualName, () => ReactNode> = {
  'impact-first': ImpactFirst,
  'three-moves': ThreeMoves,
  'trade-off': TradeOff,
  'tone-meter': ToneMeter,
  'star-stack': StarStack,
};

export function SlideVisual({ name }: { name: SlideVisualName }) {
  const Visual = VISUALS[name];
  return (
    <div aria-hidden className="rounded-xl">
      <Visual />
    </div>
  );
}
