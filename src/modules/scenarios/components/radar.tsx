'use client';

// A small radar for four or five axes, in plain SVG. It is used twice: Sprint Zero's four
// stats and the interview debrief's five competencies. Values are normalised per axis, so a
// 0-100 stat and a 1-5 score can share one picture.
import { cn } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';

export interface RadarAxis {
  key: string;
  label: string;
  value: number;
  max: number;
  /** Values at or below this are marked as a problem. Optional. */
  danger?: number;
}

const SIZE = 300;
const HEIGHT = 272;
const CENTER = { x: 150, y: 134 };
const RADIUS = 86;
const LABEL_OFFSET = 106;

const TONE = {
  mint: { fill: 'fill-mint', dot: 'fill-mint-deep' },
  coral: { fill: 'fill-coral', dot: 'fill-coral-deep' },
  sky: { fill: 'fill-sky', dot: 'fill-sky' },
  lilac: { fill: 'fill-lilac', dot: 'fill-lilac' },
  butter: { fill: 'fill-butter', dot: 'fill-butter' },
} as const;

export type RadarTone = keyof typeof TONE;

function ratio(value: number, max: number): number {
  if (!Number.isFinite(value) || max <= 0) return 0;
  return Math.max(0, Math.min(1, value / max));
}

export function Radar({
  axes,
  compare,
  tone = 'mint',
  decimals = 0,
  label,
}: {
  axes: RadarAxis[];
  /** An earlier snapshot, drawn as a dashed outline so the change is visible. */
  compare?: RadarAxis[];
  tone?: RadarTone;
  decimals?: 0 | 1;
  label: string;
}) {
  const t = useT();
  const n = axes.length;
  if (n < 3) return null;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => {
    const a = angle(i);
    return [CENTER.x + Math.cos(a) * r, CENTER.y + Math.sin(a) * r] as const;
  };
  const shape = (values: number[]) =>
    values
      .map((v, i) => {
        const [x, y] = point(i, RADIUS * Math.max(0, Math.min(1, v)));
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

  const values = axes.map((a) => ratio(a.value, a.max));
  const compareValues = compare?.map((a) => ratio(a.value, a.max));
  const toneClasses = TONE[tone];

  const description = axes
    .map((a) =>
      fmt(t.scenarios.radarValue, { label: a.label, value: a.value.toFixed(decimals), max: a.max }),
    )
    .join(', ');

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${HEIGHT}`}
      role="img"
      aria-label={`${label}: ${description}.`}
      className="h-auto w-full"
      fontSize={10}
    >
      <title>{label}</title>

      {[0.25, 0.5, 0.75, 1].map((ring) => (
        <polygon
          key={ring}
          points={shape(axes.map(() => ring))}
          fill="none"
          className="stroke-line"
          strokeWidth={ring === 1 ? 1.5 : 1}
          strokeOpacity={ring === 1 ? 0.35 : 0.16}
        />
      ))}

      {axes.map((axis, i) => {
        const [x, y] = point(i, RADIUS);
        return (
          <line
            key={axis.key}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={x}
            y2={y}
            className="stroke-line"
            strokeWidth={1}
            strokeOpacity={0.16}
          />
        );
      })}

      {compareValues ? (
        <polygon
          points={shape(compareValues)}
          fill="none"
          className="stroke-ink-soft"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          strokeOpacity={0.8}
        />
      ) : null}

      <polygon
        points={shape(values)}
        className={cn(toneClasses.fill, 'stroke-line')}
        fillOpacity={0.24}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {axes.map((axis, i) => {
        const [x, y] = point(i, RADIUS * (values[i] ?? 0));
        const low = axis.danger !== undefined && axis.value <= axis.danger;
        return (
          <circle
            key={axis.key}
            cx={x}
            cy={y}
            r={4}
            strokeWidth={2}
            className={cn('stroke-line', low ? 'fill-coral' : toneClasses.dot)}
          />
        );
      })}

      {axes.map((axis, i) => {
        const a = angle(i);
        const lx = CENTER.x + Math.cos(a) * LABEL_OFFSET;
        const ly = CENTER.y + Math.sin(a) * LABEL_OFFSET;
        const low = axis.danger !== undefined && axis.value <= axis.danger;
        return (
          <g key={axis.key}>
            <text x={lx} y={ly - 2} textAnchor="middle" className="fill-ink-soft font-semibold">
              {axis.label}
            </text>
            <text x={lx} y={ly + 12} textAnchor="middle" className="fill-ink font-bold">
              {axis.value.toFixed(decimals)}
              {low ? ' !' : ''}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
