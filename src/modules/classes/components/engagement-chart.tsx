'use client';
// Daily learning events (bars) and XP (line) for a class over the last 14 days.

import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt } from '@/i18n/format';
import { useLocale, useT } from '@/i18n/client';
import type { Locale } from '@/i18n/config';
import type { DayPoint } from '../logic';

/** "2026-10-17" → "17 Oct" (en) / "10月17日" (zh), both in UTC like the rest of the series. */
function dayLabel(day: string, locale: Locale): string {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export function EngagementChart({ data }: { data: DayPoint[] }) {
  const t = useT();
  const locale = useLocale();
  const points = data.map((d) => ({ ...d, label: dayLabel(d.day, locale) }));
  const totalEvents = data.reduce((a, d) => a + d.events, 0);
  const totalXp = data.reduce((a, d) => a + d.xp, 0);
  return (
    <figure>
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" strokeOpacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} interval="preserveStartEnd" />
            <YAxis yAxisId="events" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} />
            <YAxis yAxisId="xp" orientation="right" allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: '2px solid var(--color-line)',
                background: 'var(--color-paper)',
                color: 'var(--color-ink)',
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar
              yAxisId="events"
              dataKey="events"
              name={t.classes.chart.learningEvents}
              fill="var(--color-mint)"
              stroke="var(--color-line)"
              strokeWidth={2}
              radius={[6, 6, 0, 0]}
            />
            <Line
              yAxisId="xp"
              dataKey="xp"
              name={t.classes.chart.xpEarned}
              type="monotone"
              stroke="var(--color-coral-deep)"
              strokeWidth={3}
              dot={{ r: 3, fill: 'var(--color-butter)', stroke: 'var(--color-line)', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-sm text-ink-soft">
        {fmt(totalEvents === 1 ? t.classes.chart.captionOne : t.classes.chart.caption, {
          events: totalEvents,
          xp: totalXp,
        })}
      </figcaption>
    </figure>
  );
}
