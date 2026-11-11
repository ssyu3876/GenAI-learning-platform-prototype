// The badge map: three trails (learning, practice, showing up) with one node per badge.
// Pure SVG so it can be clicked and keyboard-focused without a chart dependency. Two layouts
// share the same data: a horizontal map on wider screens and a three-column one on phones,
// because nineteen nodes in a 300px-wide horizontal strip are too small to tap.
import { Lock } from 'lucide-react';
import { cn, type Tint } from '@/components/ui';
import { GROUP_LABEL, GROUP_ORDER, type BadgeGroup } from '../definitions';
import type { BadgeState } from '../queries';

const NODE_FILL: Record<Tint, string> = {
  paper: 'fill-paper',
  coral: 'fill-coral-soft',
  mint: 'fill-mint-soft',
  butter: 'fill-butter-soft',
  sky: 'fill-sky-soft',
  lilac: 'fill-lilac-soft',
};

const HALO_FILL: Record<Tint, string> = {
  paper: 'fill-paper',
  coral: 'fill-coral',
  mint: 'fill-mint',
  butter: 'fill-butter',
  sky: 'fill-sky',
  lilac: 'fill-lilac',
};

interface Placed {
  badge: BadgeState;
  x: number;
  y: number;
}

/** Lane geometry in viewBox units. Kept here so both layouts stay readable side by side. */
const WIDE = { width: 800, height: 206, labelX: 4, startX: 104, endX: 772, laneY: [38, 106, 174], radius: 13 };
const TALL = { width: 348, height: 300, laneX: [58, 170, 282], labelY: 12, startY: 48, endY: 272, radius: 12 };

function place(badges: BadgeState[], vertical: boolean): Placed[] {
  const out: Placed[] = [];
  GROUP_ORDER.forEach((group, lane) => {
    const items = badges.filter((b) => b.def.group === group);
    const last = Math.max(1, items.length - 1);
    items.forEach((badge, i) => {
      const t = i / last;
      out.push({
        badge,
        x: vertical ? (TALL.laneX[lane] ?? 0) : WIDE.startX + t * (WIDE.endX - WIDE.startX),
        y: vertical ? TALL.startY + t * (TALL.endY - TALL.startY) : (WIDE.laneY[lane] ?? 0),
      });
    });
  });
  return out;
}

function lanePoints(badges: BadgeState[], group: BadgeGroup, vertical: boolean): string {
  return place(badges, vertical)
    .filter((p) => p.badge.def.group === group)
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}

function BadgeNode({ placed, radius }: { placed: Placed; radius: number }) {
  const { badge, x, y } = placed;
  const { def, earned, have, need } = badge;
  const Icon = def.icon;
  const label = earned
    ? `${def.name}: earned.`
    : `${def.name}: ${need > 0 ? `${have} of ${need}` : 'not yet'}. ${def.description}`;

  return (
    <a href={`#badge-${def.id}`} aria-label={label} className="group">
      <title>{earned ? `${def.name} — earned` : `${def.name} — ${have} / ${need}`}</title>
      <g
        style={{ transformOrigin: `${x}px ${y}px` }}
        className="transition-transform duration-150 group-hover:scale-110 group-focus-visible:scale-110"
      >
        {earned ? (
          <circle cx={x} cy={y} r={radius + 6} className={HALO_FILL[def.tint]} fillOpacity={0.3} />
        ) : null}
        {/* The sticker shadow, in user units: same 2px offset idea as shadow-sticker-sm. */}
        <circle cx={x + 2} cy={y + 3} r={radius} className="fill-line" fillOpacity={0.85} />
        <circle
          cx={x}
          cy={y}
          r={radius}
          strokeWidth={2}
          className={cn(earned ? NODE_FILL[def.tint] : 'fill-cream', earned ? 'stroke-line' : 'stroke-line/40')}
        />
        <foreignObject x={x - 8} y={y - 8} width={16} height={16}>
          <div className={cn('grid h-4 w-4 place-items-center', earned ? 'text-ink' : 'text-ink-soft')}>
            {earned ? <Icon className="h-4 w-4" aria-hidden /> : <Lock className="h-3.5 w-3.5" aria-hidden />}
          </div>
        </foreignObject>
      </g>
    </a>
  );
}

function Trails({ badges, vertical }: { badges: BadgeState[]; vertical: boolean }) {
  const nodes = place(badges, vertical);

  return (
    <g strokeLinecap="round" strokeLinejoin="round">
      {GROUP_ORDER.map((group, lane) => (
        <g key={group}>
          <polyline
            points={lanePoints(badges, group, vertical)}
            fill="none"
            className="stroke-line"
            strokeWidth={3}
            strokeOpacity={0.22}
            strokeDasharray="2 7"
          />
          <text
            x={vertical ? (TALL.laneX[lane] ?? 0) : WIDE.labelX}
            y={vertical ? TALL.labelY : (WIDE.laneY[lane] ?? 0) + 4}
            textAnchor={vertical ? 'middle' : 'start'}
            className="fill-ink-soft text-[10px] font-semibold"
          >
            {GROUP_LABEL[group]}
          </text>
        </g>
      ))}
      {nodes.map((placed) => (
        <BadgeNode key={placed.badge.def.id} placed={placed} radius={vertical ? TALL.radius : WIDE.radius} />
      ))}
    </g>
  );
}

export function BadgeMap({ badges }: { badges: BadgeState[] }) {
  const earned = badges.filter((b) => b.earned).length;
  const perGroup = GROUP_ORDER.map(
    (group) =>
      `${GROUP_LABEL[group]} ${badges.filter((b) => b.def.group === group && b.earned).length} of ${
        badges.filter((b) => b.def.group === group).length
      }`,
  ).join(', ');

  return (
    <div className="flex flex-col gap-3">
      <div className="hidden sm:block">
        <svg
          viewBox={`0 0 ${WIDE.width} ${WIDE.height}`}
          role="group"
          aria-label={`Badge map. ${earned} of ${badges.length} earned. ${perGroup}.`}
          className="h-auto w-full"
        >
          <Trails badges={badges} vertical={false} />
        </svg>
      </div>
      <div className="sm:hidden">
        <svg
          viewBox={`0 0 ${TALL.width} ${TALL.height}`}
          role="group"
          aria-label={`Badge map. ${earned} of ${badges.length} earned. ${perGroup}.`}
          className="h-auto w-full"
        >
          <Trails badges={badges} vertical />
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-line bg-mint-soft" aria-hidden />
          earned
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-line bg-cream" aria-hidden />
          still open
        </span>
        <span className="ml-auto font-semibold text-ink">
          {earned} / {badges.length}
        </span>
      </div>
    </div>
  );
}
