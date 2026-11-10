'use client';
// Stacked bars of real vs mocked AI calls per day.

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLocale, useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import type { AiDayPoint } from '../queries';

export function UsageChart({ data }: { data: AiDayPoint[] }) {
  const t = useT();
  const locale = useLocale();
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const real = data.reduce((a, d) => a + d.real, 0);
  const mock = data.reduce((a, d) => a + d.mock, 0);
  const points = data.map((d) => ({
    ...d,
    label: new Date(d.day).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
  }));
  return (
    <figure>
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" strokeOpacity={0.15} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'var(--color-ink-soft)' }} />
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
              dataKey="real"
              name={t.admin.aiUsage.chart.realAi}
              stackId="calls"
              fill="var(--color-lilac)"
              stroke="var(--color-line)"
              strokeWidth={2}
            />
            <Bar
              dataKey="mock"
              name={t.admin.aiUsage.chart.demoMode}
              stackId="calls"
              fill="var(--color-butter)"
              stroke="var(--color-line)"
              strokeWidth={2}
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-sm text-ink-soft">
        {fmt(t.admin.aiUsage.chart.caption, { days: data.length, real, mock })}
      </figcaption>
    </figure>
  );
}
