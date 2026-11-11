'use client';

// Small diagrams for narrated slides. Deliberately word-free: the narration and captions
// carry the language, so one diagram works in English and Chinese without a second copy.
// Add a name here, then put it on a slide as `visual: 'name'`; unknown names are ignored.
//
// Step diagrams follow the narration. While Pip reads a slide, the player passes the index
// of the bullet being read as `active`; the diagram lights up the matching part and fades the
// rest. Numbered diagrams use the same numbers as the bullets. When nothing is playing,
// every part is shown at full strength.
import { Fragment, useId, type ReactNode } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CircleCheck,
  CircleDashed,
  CircleX,
  ClipboardCheck,
  Code,
  ClipboardList,
  Clock,
  Cloud,
  Eye,
  FlaskConical,
  GitCommitHorizontal,
  GitMerge,
  Goal,
  Hammer,
  HelpCircle,
  History,
  Lightbulb,
  MapPin,
  Link2,
  ListOrdered,
  LoaderCircle,
  Megaphone,
  MessageCircleQuestion,
  MessagesSquare,
  MousePointerClick,
  PenTool,
  Plus,
  Presentation,
  RefreshCw,
  Rocket,
  RotateCw,
  Route,
  Ruler,
  Search,
  Smartphone,
  Snail,
  Sparkles,
  Split,
  Store,
  Sunrise,
  Target,
  Trophy,
  Undo2,
  UserMinus,
  UserRound,
  Users,
  Wrench,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/components/ui';

export const SLIDE_VISUALS = [
  'impact-first',
  'three-moves',
  'trade-off',
  'software-loop',
  'user-story',
  'vague-to-testable',
  'why-ladder',
  'open-closed',
  'sprint-cycle',
  'task-board',
  'done-checklist',
  'test-pyramid',
  'ci-pipeline',
  'safe-release',
  'tone-meter',
  'star-stack',
  'dialogue-review',
  'dialogue-interview',
  'dialogue-client',
] as const;
export type SlideVisualName = (typeof SLIDE_VISUALS)[number];

export function isSlideVisual(name: string): name is SlideVisualName {
  return (SLIDE_VISUALS as readonly string[]).includes(name);
}

/** Diagrams whose parts carry the bullet numbers (1, 2, 3…), so bullets show numbers too. */
const NUMBERED_VISUALS: ReadonlySet<SlideVisualName> = new Set([
  'user-story',
  'vague-to-testable',
  'why-ladder',
  'open-closed',
  'sprint-cycle',
  'task-board',
  'done-checklist',
  'test-pyramid',
  'ci-pipeline',
  'safe-release',
]);

export function isNumberedVisual(name: SlideVisualName): boolean {
  return NUMBERED_VISUALS.has(name);
}

/** Index of the bullet being narrated, or null when Pip is quiet. */
type Active = number | null;
interface VisualProps {
  active: Active;
}

const FADE = 'transition duration-300 ease-out motion-reduce:transition-none';

function stepState(step: number, active: Active): 'idle' | 'on' | 'off' {
  if (active === null) return 'idle';
  return step === active ? 'on' : 'off';
}

/** Classes for one part of an HTML step diagram. */
function stepClass(step: number, active: Active) {
  const state = stepState(step, active);
  return cn(
    FADE,
    state === 'on' && '-translate-y-0.5 ring-2 ring-coral ring-offset-2 ring-offset-paper',
    state === 'off' && 'opacity-40',
  );
}

function Badge({ n, on }: { n: number; on?: boolean }) {
  return (
    <span
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-line font-display text-[11px] font-bold leading-none text-ink',
        on ? 'bg-coral' : 'bg-paper',
      )}
    >
      {n}
    </span>
  );
}

function Arrow() {
  return <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />;
}

/** A numbered box in a step diagram. */
function Tile({
  step,
  active,
  tone,
  className,
  children,
}: {
  step: number;
  active: Active;
  tone: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-blob border-2 border-line px-2 py-3',
        tone,
        stepClass(step, active),
        className,
      )}
    >
      <span className="absolute -left-2 -top-2">
        <Badge n={step + 1} on={active === step} />
      </span>
      {children}
    </div>
  );
}

/** Grey bars standing in for text, so the diagram needs no words. */
function TextLines({ widths, tone = 'bg-ink/15' }: { widths: string[]; tone?: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5" aria-hidden>
      {widths.map((w, i) => (
        <span key={i} className={cn('h-2 rounded-pill', w, tone)} />
      ))}
    </div>
  );
}

/** Makes an SVG-safe id for markers (useId can return characters url(#…) dislikes). */
function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
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

// ---- Step diagrams for "How Software Gets Built" -------------------------------------------

/** The seven stages of the software loop. Bullet 1 covers the first three, bullet 2 the rest. */
const LOOP: { icon: LucideIcon; group: number }[] = [
  { icon: Search, group: 0 },
  { icon: ListOrdered, group: 0 },
  { icon: PenTool, group: 0 },
  { icon: Hammer, group: 1 },
  { icon: FlaskConical, group: 1 },
  { icon: Rocket, group: 1 },
  { icon: Lightbulb, group: 1 },
];
const LOOP_CX = 160;
const LOOP_CY = 82;
const LOOP_RX = 128;
const LOOP_RY = 58;

function loopPoint(t: number) {
  const angle = Math.PI + (t * 2 * Math.PI) / LOOP.length;
  return {
    x: LOOP_CX + LOOP_RX * Math.cos(angle),
    y: LOOP_CY + LOOP_RY * Math.sin(angle),
    // Direction of travel (clockwise on screen), in degrees, for the little chevrons
    heading: (Math.atan2(LOOP_RY * Math.cos(angle), -LOOP_RX * Math.sin(angle)) * 180) / Math.PI,
  };
}

function SoftwareLoop({ active }: VisualProps) {
  return (
    <svg viewBox="0 0 320 164" className="mx-auto block w-full max-w-md">
      <ellipse
        cx={LOOP_CX}
        cy={LOOP_CY}
        rx={LOOP_RX}
        ry={LOOP_RY}
        fill="none"
        className="stroke-ink-soft"
        strokeWidth={2}
        strokeDasharray="3 6"
      />
      {LOOP.map((_, k) => {
        const p = loopPoint(k + 0.5);
        return (
          <path
            key={k}
            d="M -4 -5 L 3 0 L -4 5"
            transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.heading.toFixed(1)})`}
            fill="none"
            className="stroke-ink-soft"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}
      <RotateCw x={LOOP_CX - 16} y={LOOP_CY - 16} width={32} height={32} className="text-ink-soft" />
      {LOOP.map(({ icon: Icon, group }, k) => {
        const p = loopPoint(k);
        const state = stepState(group, active);
        return (
          <g key={k} className={cn(FADE, state === 'off' && 'opacity-35')}>
            <circle
              cx={p.x}
              cy={p.y}
              r={19}
              className={cn(
                group === 0 ? 'fill-sky-soft' : 'fill-mint-soft',
                state === 'on' ? 'stroke-coral-deep' : 'stroke-line',
              )}
              strokeWidth={state === 'on' ? 3 : 2}
            />
            <Icon x={p.x - 9} y={p.y - 9} width={18} height={18} className="text-ink" />
          </g>
        );
      })}
    </svg>
  );
}

const STORY_PARTS: { icon: LucideIcon; tone: string }[] = [
  { icon: UserRound, tone: 'bg-sky-soft' },
  { icon: MousePointerClick, tone: 'bg-lilac-soft' },
  { icon: Goal, tone: 'bg-butter-soft' },
];

/** Who + what + why. The "why" gets a sparkle: it is the part people skip. */
function UserStory({ active }: VisualProps) {
  return (
    <div className="flex items-center gap-1.5 pl-2 pt-2 sm:gap-2">
      {STORY_PARTS.map(({ icon: Icon, tone }, i) => (
        <Fragment key={i}>
          {i > 0 ? <Plus className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden /> : null}
          <Tile step={i} active={active} tone={tone}>
            <Icon className="h-6 w-6 text-ink" aria-hidden />
            {i === STORY_PARTS.length - 1 ? (
              <Sparkles className="absolute -right-1.5 -top-2 h-4 w-4 text-coral-deep" aria-hidden />
            ) : null}
          </Tile>
        </Fragment>
      ))}
    </div>
  );
}

/** A fuzzy word, turned into a number, gives a clear yes or no. */
function VagueToTestable({ active }: VisualProps) {
  return (
    <div className="flex items-center gap-1.5 pl-2 pt-2 sm:gap-2">
      <Tile step={0} active={active} tone="bg-cream">
        <Cloud className="h-6 w-6 text-ink-soft" aria-hidden />
        <svg viewBox="0 0 28 10" className="h-3 w-7" aria-hidden>
          <path d="M1 5 Q 4.5 0 8 5 T 15 5 T 22 5 T 27 5" fill="none" className="stroke-ink-soft" strokeWidth={2} strokeLinecap="round" />
        </svg>
      </Tile>
      <Arrow />
      <Tile step={1} active={active} tone="bg-sky-soft">
        <Ruler className="h-5 w-5 text-ink" aria-hidden />
        <span className="font-display text-lg font-bold leading-none">2s</span>
      </Tile>
      <Arrow />
      <Tile step={2} active={active} tone="bg-mint-soft">
        <Check className="h-5 w-5 text-mint-deep" strokeWidth={3} aria-hidden />
        <span className="text-ink-soft" aria-hidden>
          /
        </span>
        <X className="h-5 w-5 text-coral-deep" strokeWidth={3} aria-hidden />
      </Tile>
    </div>
  );
}

const WHY_STEPS: { icons: LucideIcon[]; tone: string }[] = [
  { icons: [Smartphone], tone: 'bg-cream' },
  { icons: [Sparkles], tone: 'bg-cream' },
  { icons: [UserMinus], tone: 'bg-butter-soft' },
  { icons: [Users, Clock], tone: 'bg-mint-soft' },
];

/** Asking "why?" again and again, from the requested solution down to the real need. */
function WhyLadder({ active }: VisualProps) {
  return (
    <div className="flex items-center gap-1 pl-2 pt-2 sm:gap-2">
      {WHY_STEPS.map(({ icons, tone }, i) => (
        <Fragment key={i}>
          {i > 0 ? (
            <span className="flex shrink-0 flex-col items-center text-ink-soft" aria-hidden>
              <span className="font-display text-sm font-bold leading-none">?</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <Tile
            step={i}
            active={active}
            tone={tone}
            className={cn(i === WHY_STEPS.length - 1 && 'border-[3px]')}
          >
            {icons.map((Icon, k) => (
              <Icon key={k} className={cn('text-ink', k === 0 ? 'h-5 w-5' : 'h-3.5 w-3.5')} aria-hidden />
            ))}
          </Tile>
        </Fragment>
      ))}
    </div>
  );
}

/** A closed question gets one word back; an open one gets a story. */
function OpenClosed({ active }: VisualProps) {
  const rows = [
    {
      tone: 'bg-coral-soft',
      reply: (
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-6 rounded-pill bg-ink/25" />
          <Check className="h-4 w-4 text-ink-soft" aria-hidden />
        </span>
      ),
    },
    { tone: 'bg-mint-soft', reply: <TextLines widths={['w-full', 'w-11/12', 'w-3/4', 'w-5/6']} tone="bg-mint-deep/40" /> },
  ];
  return (
    <div className="grid gap-2.5 pl-2 pt-2">
      {rows.map(({ tone, reply }, i) => (
        <div
          key={i}
          className={cn(
            'relative flex items-center gap-3 rounded-blob border-2 border-line px-4 py-3',
            tone,
            stepClass(i, active),
          )}
        >
          <span className="absolute -left-2 -top-2">
            <Badge n={i + 1} on={active === i} />
          </span>
          <MessageCircleQuestion className="h-5 w-5 shrink-0 text-ink" aria-hidden />
          <Arrow />
          {reply}
        </div>
      ))}
    </div>
  );
}

const SPRINT_NODES: { x: number; r: number; icon: LucideIcon; fill: string }[] = [
  { x: 34, r: 22, icon: ListOrdered, fill: 'fill-cream' },
  { x: 100, r: 22, icon: ClipboardList, fill: 'fill-butter-soft' },
  { x: 176, r: 32, icon: RefreshCw, fill: 'fill-lilac-soft' },
  { x: 252, r: 22, icon: Presentation, fill: 'fill-sky-soft' },
  { x: 314, r: 22, icon: MessagesSquare, fill: 'fill-mint-soft' },
];
const SPRINT_Y = 58;

/** Backlog → planning → the sprint (with a daily stand-up) → review → retro, and round again. */
function SprintCycle({ active }: VisualProps) {
  const arrow = useSvgId('sprint-arrow');
  return (
    <svg viewBox="0 0 340 140" className="mx-auto block w-full max-w-lg">
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-ink-soft" />
        </marker>
      </defs>
      {SPRINT_NODES.slice(0, -1).map((node, i) => {
        const next = SPRINT_NODES[i + 1]!;
        return (
          <line
            key={i}
            x1={node.x + node.r + 3}
            y1={SPRINT_Y}
            x2={next.x - next.r - 4}
            y2={SPRINT_Y}
            className="stroke-ink-soft"
            strokeWidth={2}
            markerEnd={`url(#${arrow})`}
          />
        );
      })}
      {/* After the retro, the next sprint starts from the backlog again */}
      <path
        d={`M 314 ${SPRINT_Y + 26} C 314 132, 34 132, 34 ${SPRINT_Y + 28}`}
        fill="none"
        className="stroke-ink-soft"
        strokeWidth={2}
        strokeDasharray="4 5"
        markerEnd={`url(#${arrow})`}
      />
      {SPRINT_NODES.map(({ x, r, icon: Icon, fill }, i) => {
        const state = stepState(i, active);
        const size = i === 2 ? 26 : 20;
        return (
          <g key={i} className={cn(FADE, state === 'off' && 'opacity-35')}>
            <circle
              cx={x}
              cy={SPRINT_Y}
              r={r}
              className={cn(fill, state === 'on' ? 'stroke-coral-deep' : 'stroke-line')}
              strokeWidth={state === 'on' ? 3 : 2}
            />
            <Icon x={x - size / 2} y={SPRINT_Y - size / 2} width={size} height={size} className="text-ink" />
            {i === 2 ? (
              // The daily stand-up rides along inside the sprint
              <g>
                <circle cx={x + 26} cy={SPRINT_Y - 26} r={12} className="fill-butter stroke-line" strokeWidth={2} />
                <Sunrise x={x + 19} y={SPRINT_Y - 33} width={14} height={14} className="text-ink" />
              </g>
            ) : null}
            <circle
              cx={x - r * 0.75}
              cy={SPRINT_Y - r * 0.75}
              r={9}
              className={cn(state === 'on' ? 'fill-coral' : 'fill-paper', 'stroke-line')}
              strokeWidth={2}
            />
            <text
              x={x - r * 0.75}
              y={SPRINT_Y - r * 0.75}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-ink font-display text-[11px] font-bold"
            >
              {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

const BOARD: { icon: LucideIcon; tone: string; cards: number }[] = [
  { icon: CircleDashed, tone: 'bg-sky-soft', cards: 3 },
  { icon: LoaderCircle, tone: 'bg-butter-soft', cards: 2 },
  { icon: Eye, tone: 'bg-lilac-soft', cards: 1 },
  { icon: CircleCheck, tone: 'bg-mint-soft', cards: 2 },
];

/** To do → in progress → review → done. */
function TaskBoard({ active }: VisualProps) {
  return (
    <div className="grid grid-cols-4 gap-1.5 pl-1 pt-1 sm:gap-2">
      {BOARD.map(({ icon: Icon, tone, cards }, i) => (
        <div
          key={i}
          className={cn('flex min-h-28 flex-col gap-1.5 rounded-xl border-2 border-line p-1.5', tone, stepClass(i, active))}
        >
          <div className="flex items-center gap-1">
            <Badge n={i + 1} on={active === i} />
            <Icon className="h-4 w-4 text-ink" aria-hidden />
          </div>
          {Array.from({ length: cards }, (_, k) => (
            <div key={k} className="flex items-center gap-1 rounded-md border-2 border-line bg-paper px-1 py-1">
              <span className="h-1.5 flex-1 rounded-pill bg-ink/20" />
              {i === 1 && k === 0 ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-coral" /> : null}
              {i === 3 ? <Check className="h-3 w-3 shrink-0 text-mint-deep" strokeWidth={3} aria-hidden /> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const DONE_ITEMS: LucideIcon[] = [ClipboardCheck, FlaskConical, Users, Rocket];

/** The Definition of Done: boxes tick one by one as Pip reads them. */
function DoneChecklist({ active }: VisualProps) {
  return (
    <div className="grid gap-1.5">
      {DONE_ITEMS.map((Icon, i) => {
        const checked = active === null || i <= active;
        return (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2.5 rounded-xl border-2 border-line bg-paper px-3 py-1.5',
              FADE,
              active === i && 'ring-2 ring-coral ring-offset-2 ring-offset-paper',
              active !== null && i > active && 'opacity-40',
            )}
          >
            <Badge n={i + 1} on={active === i} />
            <span
              className={cn(
                'grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 border-line',
                checked ? 'bg-mint' : 'bg-paper',
              )}
            >
              {checked ? <Check className="h-4 w-4 animate-pop text-ink" strokeWidth={3} aria-hidden /> : null}
            </span>
            <Icon className="h-4 w-4 shrink-0 text-ink" aria-hidden />
            <span className="h-2 flex-1 rounded-pill bg-ink/15" />
          </div>
        );
      })}
    </div>
  );
}

const PYRAMID_APEX_X = 140;
/** Half the pyramid's width at height y: a point at the top (y=8), 240 wide at the base. */
const halfWidth = (y: number) => (120 * (y - 8)) / 160;
const PYRAMID_LAYERS = [
  { top: 112, bottom: 168, fill: 'fill-mint-soft' }, // 1: unit tests, many and fast
  { top: 60, bottom: 108, fill: 'fill-sky-soft' }, // 2: integration tests
  { top: 8, bottom: 56, fill: 'fill-coral-soft' }, // 3: a few end-to-end tests
];

function layerPoints(top: number, bottom: number) {
  const t = halfWidth(top);
  const b = halfWidth(bottom);
  const x = PYRAMID_APEX_X;
  return `${x - t},${top} ${x + t},${top} ${x + b},${bottom} ${x - b},${bottom}`;
}

/** Many small fast tests at the bottom, a few slow journey tests at the top. */
function TestPyramid({ active }: VisualProps) {
  const arrow = useSvgId('pyramid-arrow');
  return (
    <svg viewBox="0 0 320 176" className="mx-auto block w-full max-w-md">
      <defs>
        <marker id={arrow} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="fill-ink-soft" />
        </marker>
      </defs>
      {PYRAMID_LAYERS.map(({ top, bottom, fill }, i) => {
        const state = stepState(i, active);
        const mid = (top + bottom) / 2;
        const badgeX = PYRAMID_APEX_X - halfWidth(mid) - 16;
        return (
          <g key={i} className={cn(FADE, state === 'off' && 'opacity-35')}>
            <polygon
              points={layerPoints(top, bottom)}
              className={cn(fill, state === 'on' ? 'stroke-coral-deep' : 'stroke-line')}
              strokeWidth={state === 'on' ? 3 : 2}
              strokeLinejoin="round"
            />
            {i === 0
              ? // Lots of tiny unit tests
                [
                  { y: 122, count: 8 },
                  { y: 144, count: 10 },
                ].flatMap(({ y, count }) =>
                  Array.from({ length: count }, (_, k) => (
                    <rect
                      key={`${y}-${k}`}
                      x={PYRAMID_APEX_X - (count * 18 - 6) / 2 + k * 18}
                      y={y}
                      width={12}
                      height={12}
                      rx={2}
                      className="fill-mint stroke-line"
                      strokeWidth={1.5}
                    />
                  )),
                )
              : null}
            {i === 1
              ? // A few pieces tested together
                [0, 1, 2].map((k) => (
                  <g key={k}>
                    {k > 0 ? (
                      <line x1={96 + k * 34 - 14} y1={84} x2={96 + k * 34} y2={84} className="stroke-line" strokeWidth={2} />
                    ) : null}
                    <rect x={96 + k * 34} y={77} width={20} height={14} rx={3} className="fill-sky stroke-line" strokeWidth={1.5} />
                  </g>
                ))
              : null}
            {i === 2 ? <Route x={PYRAMID_APEX_X - 8} y={30} width={16} height={16} className="text-ink" /> : null}
            <circle cx={badgeX} cy={mid} r={9} className={cn(state === 'on' ? 'fill-coral' : 'fill-paper', 'stroke-line')} strokeWidth={2} />
            <text x={badgeX} y={mid} textAnchor="middle" dominantBaseline="central" className="fill-ink font-display text-[11px] font-bold">
              {i + 1}
            </text>
          </g>
        );
      })}
      {/* Higher up the pyramid: slower and costlier. Lower down: fast and cheap. */}
      <line
        x1={300}
        y1={140}
        x2={300}
        y2={36}
        className="stroke-ink-soft"
        strokeWidth={2}
        markerStart={`url(#${arrow})`}
        markerEnd={`url(#${arrow})`}
      />
      <Snail x={290} y={6} width={20} height={20} className="text-ink-soft" />
      <Zap x={290} y={148} width={20} height={20} className="text-ink-soft" />
    </svg>
  );
}

/** Small change → tests run on their own → merge it, or fix it while it is fresh. */
function CiPipeline({ active }: VisualProps) {
  return (
    <div className="flex items-center gap-1.5 pl-2 pt-2 sm:gap-2">
      <Tile step={0} active={active} tone="bg-lilac-soft">
        <GitCommitHorizontal className="h-6 w-6 text-ink" aria-hidden />
      </Tile>
      <Arrow />
      <Tile step={1} active={active} tone="bg-butter-soft">
        <FlaskConical className="h-5 w-5 text-ink" aria-hidden />
        <span className="flex gap-0.5" aria-hidden>
          <span className="h-2 w-2 rounded-full bg-mint-deep" />
          <span className="h-2 w-2 rounded-full bg-mint-deep" />
          <span className="h-2 w-2 rounded-full bg-coral-deep" />
        </span>
      </Tile>
      <Arrow />
      <Tile step={2} active={active} tone="bg-cream" className="flex-col gap-1 py-2">
        <span className="flex items-center gap-1">
          <CircleCheck className="h-4 w-4 text-mint-deep" aria-hidden />
          <GitMerge className="h-4 w-4 text-ink" aria-hidden />
        </span>
        <span className="flex items-center gap-1">
          <CircleX className="h-4 w-4 text-coral-deep" aria-hidden />
          <Wrench className="h-4 w-4 text-ink" aria-hidden />
        </span>
      </Tile>
    </div>
  );
}

/** One canteen first, watch it, then everyone, with a way back if it breaks. */
function SafeRelease({ active }: VisualProps) {
  return (
    <div className="grid gap-3 pl-2 pt-2">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Tile step={0} active={active} tone="bg-butter-soft">
          <Store className="h-5 w-5 text-ink" aria-hidden />
          <Rocket className="h-3.5 w-3.5 text-ink" aria-hidden />
        </Tile>
        <Arrow />
        <Tile step={1} active={active} tone="bg-sky-soft">
          <Activity className="h-5 w-5 text-ink" aria-hidden />
          <Eye className="h-3.5 w-3.5 text-ink" aria-hidden />
        </Tile>
        <Arrow />
        <Tile step={2} active={active} tone="bg-mint-soft" className="py-2">
          <span className="grid grid-cols-2 gap-0.5" aria-hidden>
            {[0, 1, 2, 3].map((k) => (
              <Store key={k} className="h-3.5 w-3.5 text-ink" />
            ))}
          </span>
        </Tile>
      </div>
      <div className="flex justify-center">
        <div
          className={cn(
            'relative flex items-center gap-2 rounded-pill border-2 border-dashed border-line bg-coral-soft px-5 py-1.5',
            stepClass(3, active),
          )}
        >
          <span className="absolute -left-2 -top-2">
            <Badge n={4} on={active === 3} />
          </span>
          <Undo2 className="h-4 w-4 text-coral-deep" aria-hidden />
          <History className="h-4 w-4 text-ink" aria-hidden />
        </div>
      </div>
    </div>
  );
}

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
function StarStack({ active = null }: VisualProps) {
  return (
    <div className="flex items-stretch gap-2">
      {STAR_BOXES.map(({ letter, icon: Icon, tone }, i) => {
        const visible = active === null || active >= i;
        return (
          <div key={letter} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                'flex flex-1 flex-col items-center gap-1 rounded-blob border-2 border-line px-2 py-3 transition-all duration-300',
                tone,
                visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
              )}
            >
              <span className="font-display text-xl leading-none font-bold">{letter}</span>
              <Icon className="h-5 w-5 text-ink" aria-hidden />
            </div>
            {i < STAR_BOXES.length - 1 ? (
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-soft" aria-hidden />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** A small friendly face, used in the dialogue scenes. No words, so it works in both locales. */
function Face({
  tone,
  mood,
  flip,
}: {
  tone: string;
  mood: 'happy' | 'think' | 'worried';
  flip?: boolean;
}) {
  const mouth =
    mood === 'happy' ? 'M24 40 Q32 47 40 40' : mood === 'think' ? 'M25 41 H39' : 'M24 44 Q32 38 40 44';
  return (
    <svg viewBox="0 0 64 64" className={cn('h-20 w-20 shrink-0', flip && '-scale-x-100')} aria-hidden>
      <circle cx="32" cy="34" r="23" strokeWidth={3} className={cn('stroke-line', tone)} />
      <path d="M13 27 Q18 9 32 9 Q46 9 51 27" fill="none" strokeWidth={3} strokeLinecap="round" className="stroke-line" />
      <circle cx="24" cy="31" r="2.5" className="fill-ink" />
      <circle cx="40" cy="31" r="2.5" className="fill-ink" />
      <path d={mouth} fill="none" strokeWidth={2.5} strokeLinecap="round" className="stroke-line" />
    </svg>
  );
}

function Bubble({ tone, show = true, children }: { tone: string; show?: boolean; children: ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-blob border-2 border-line px-3 py-2 shadow-sticker-sm transition-all duration-300',
        tone,
        show ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0',
      )}
    >
      {children}
    </div>
  );
}

/** Reviewer points at the line; the author listens. Bubbles appear with the narration. */
function DialogueReview({ active = null }: VisualProps) {
  const show = (at: number) => active === null || active >= at;
  return (
    <div className="grid grid-cols-2 items-end gap-3">
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-cream" show={show(0)}>
          <HelpCircle className="h-4 w-4 text-ink-soft" aria-hidden />
        </Bubble>
        <Face tone="fill-butter-soft" mood="worried" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-mint-soft" show={show(2)}>
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-ink-soft" aria-hidden />
            <span className="h-2 w-16 rounded-pill bg-ink/25" aria-hidden />
            <Check className="h-4 w-4 text-mint-deep" aria-hidden />
          </div>
        </Bubble>
        <Face tone="fill-mint-soft" mood="happy" flip />
      </div>
    </div>
  );
}

/** The candidate answers with the four STAR beats; the interviewer asks for more. */
function DialogueInterview({ active = null }: VisualProps) {
  const show = (at: number) => active === null || active >= at;
  return (
    <div className="grid grid-cols-2 items-end gap-3">
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-paper" show={show(0)}>
          <div className="flex items-center gap-1" aria-hidden>
            {['S', 'T', 'A', 'R'].map((letter) => (
              <span
                key={letter}
                className="grid h-6 w-6 place-items-center rounded-md border-2 border-line bg-butter-soft font-display text-[0.65rem] font-bold"
              >
                {letter}
              </span>
            ))}
          </div>
        </Bubble>
        <Face tone="fill-coral-soft" mood="happy" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-sky-soft" show={show(2)}>
          <HelpCircle className="h-4 w-4 text-ink-soft" aria-hidden />
        </Bubble>
        <Face tone="fill-sky-soft" mood="think" flip />
      </div>
    </div>
  );
}

/** The client is confused; the engineer answers with what changed. */
function DialogueClient({ active = null }: VisualProps) {
  const show = (at: number) => active === null || active >= at;
  return (
    <div className="grid grid-cols-2 items-end gap-3">
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-cream" show={show(0)}>
          <HelpCircle className="h-4 w-4 text-ink-soft" aria-hidden />
        </Bubble>
        <Face tone="fill-lilac-soft" mood="worried" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <Bubble tone="bg-mint-soft" show={show(2)}>
          <div className="flex items-center gap-1 font-display text-sm font-bold">
            12s <ArrowRight className="h-3 w-3 text-ink-soft" aria-hidden /> 2s
          </div>
        </Bubble>
        <Face tone="fill-mint-soft" mood="happy" flip />
      </div>
    </div>
  );
}

const VISUALS: Record<SlideVisualName, (props: VisualProps) => ReactNode> = {
  'impact-first': ImpactFirst,
  'three-moves': ThreeMoves,
  'trade-off': TradeOff,
  'software-loop': SoftwareLoop,
  'user-story': UserStory,
  'vague-to-testable': VagueToTestable,
  'why-ladder': WhyLadder,
  'open-closed': OpenClosed,
  'sprint-cycle': SprintCycle,
  'task-board': TaskBoard,
  'done-checklist': DoneChecklist,
  'test-pyramid': TestPyramid,
  'ci-pipeline': CiPipeline,
  'safe-release': SafeRelease,
  'tone-meter': ToneMeter,
  'star-stack': StarStack,
  'dialogue-review': DialogueReview,
  'dialogue-interview': DialogueInterview,
  'dialogue-client': DialogueClient,
};

export function SlideVisual({ name, active = null }: { name: SlideVisualName; active?: number | null }) {
  const Visual = VISUALS[name];
  return (
    <div aria-hidden className="rounded-xl">
      <Visual active={active} />
    </div>
  );
}
