'use client';

// Project quality across the turns of one Ship It run. Hand-drawn SVG on purpose: a chart
// dependency would break the module's no-new-dependencies rule, and the shape is simple.
// Colours come from theme tokens (stroke-coral, fill-ink-soft), never hex values.
import { Card, CardBody, CardHeader } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import type { Translations } from '@/i18n';

export interface QualityPoint {
  /** 0 is the start of the run; 1..n are turn numbers in play order. */
  turn: number;
  quality: number;
  label: string;
}

const WIDTH = 320;
const HEIGHT = 140;
const PAD = { top: 14, right: 12, bottom: 24, left: 28 };
const MAX_QUALITY = 100;

/** The one sentence under the plot. Real numbers, no adjectives. */
function describe(points: QualityPoint[], t: Translations): string {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last || points.length < 2) return t.scenarios.ship.qualityEmpty;

  let worst: { turn: number; drop: number } | null = null;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    if (!prev || !current) continue;
    const drop = current.quality - prev.quality;
    if (drop < 0 && (!worst || drop < worst.drop)) worst = { turn: current.turn, drop };
  }

  const lost = first.quality - last.quality;
  if (lost === 0) return fmt(t.scenarios.ship.qualityHeld, { quality: last.quality });
  if (!worst) return fmt(t.scenarios.ship.qualityDown, { lost, quality: last.quality });
  return fmt(t.scenarios.ship.qualityDownWorst, {
    lost,
    quality: last.quality,
    turn: worst.turn,
    drop: worst.drop,
  });
}

export function QualityChart({ points, total }: { points: QualityPoint[]; total: number }) {
  const t = useT();
  const first = points[0];
  const last = points[points.length - 1];

  if (!first || !last || points.length < 2) {
    return (
      <div className="flex h-24 items-center justify-center rounded-blob border-2 border-dashed border-line/50 px-4 text-center text-xs text-ink-soft">
        {t.scenarios.ship.qualityEmpty}
      </div>
    );
  }

  const turns = Math.max(1, total);
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (turn: number) => PAD.left + (turn / turns) * plotWidth;
  const y = (quality: number) => PAD.top + (1 - quality / MAX_QUALITY) * plotHeight;

  const shape = points.map((p) => `${x(p.turn).toFixed(1)},${y(p.quality).toFixed(1)}`).join(' ');
  const area = [
    `${x(first.turn).toFixed(1)},${y(0)}`,
    shape,
    `${x(last.turn).toFixed(1)},${y(0)}`,
  ].join(' ');

  const worstPoint = points
    .slice(1)
    .map((p, i) => ({ point: p, drop: p.quality - (points[i]?.quality ?? p.quality) }))
    .filter((d) => d.drop < 0)
    .sort((a, b) => a.drop - b.drop)[0];

  // Numbers only: the title names the series, and the caption says what happened in words.
  const aria = `${t.scenarios.ship.qualityAria}: ${points.map((p) => p.quality).join(' → ')}`;

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={aria}
      className="h-auto w-full"
      fontSize={9}
    >
      <title>{t.scenarios.ship.qualityByTurn}</title>

      {[100, 50, 0].map((value) => (
        <g key={value}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(value)}
            y2={y(value)}
            className="stroke-line"
            strokeWidth={value === 0 ? 2 : 1}
            strokeOpacity={value === 0 ? 1 : 0.3}
            strokeDasharray={value === 50 ? '4 4' : undefined}
          />
          <text x={PAD.left - 6} y={y(value) + 3} textAnchor="end" className="fill-ink-soft">
            {value}
          </text>
        </g>
      ))}

      {Array.from({ length: turns }, (_, i) => i + 1).map((turn) => (
        <text key={turn} x={x(turn)} y={HEIGHT - 8} textAnchor="middle" className="fill-ink-soft">
          {turn}
        </text>
      ))}

      <polygon points={area} className="fill-coral" fillOpacity={0.14} />
      <polyline
        points={shape}
        fill="none"
        className="stroke-coral"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {points.map((p) => (
        <circle
          key={p.turn}
          cx={x(p.turn)}
          cy={y(p.quality)}
          r={p === last ? 5 : 3}
          strokeWidth={2}
          className={p === last ? 'fill-coral stroke-line' : 'fill-paper stroke-line'}
        />
      ))}

      {worstPoint ? (
        <text
          x={x(worstPoint.point.turn)}
          y={Math.max(PAD.top + 6, y(worstPoint.point.quality) - 9)}
          textAnchor="middle"
          className="fill-coral-deep font-semibold"
        >
          {worstPoint.drop}
        </text>
      ) : null}
    </svg>
  );
}

export function QualityTrendCard({
  points,
  total,
  subtitle,
}: {
  points: QualityPoint[];
  total: number;
  subtitle?: string;
}) {
  const t = useT();

  return (
    <Card>
      <CardHeader
        title={t.scenarios.ship.qualityByTurn}
        subtitle={
          subtitle ?? fmt(t.scenarios.ship.turnsReviewed, { reviewed: Math.max(0, points.length - 1), total })
        }
      />
      <CardBody className="flex flex-col gap-2">
        {/* Capped and centred: the SVG scales as one picture, so text would grow to 30px
            inside a full-width desktop card. */}
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2">
          <QualityChart points={points} total={total} />
          <p className="text-xs text-ink-soft">{describe(points, t)}</p>
        </div>
      </CardBody>
    </Card>
  );
}
