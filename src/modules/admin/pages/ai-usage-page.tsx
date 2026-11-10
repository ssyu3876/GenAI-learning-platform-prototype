// /admin/ai-usage: how much AI the platform uses, per feature, and how much ran in demo mode.
import { Bot, Clock, KeyRound, Sparkles } from 'lucide-react';
import { isAiConfigured } from '@/core/ai/client';
import { Badge, Card, CardBody, CardHeader, EmptyState, Notice, PageHeader, Stat } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { AdminNav } from '../components/admin-nav';
import { UsageChart } from '../components/usage-chart';
import { getAiUsageReport } from '../queries';

export async function AdminAiUsagePage() {
  const { locale, t } = await getT();
  const report = await getAiUsageReport(14);
  const configured = isAiConfigured();
  const { totals } = report;
  const numberLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const num = (n: number) => n.toLocaleString(numberLocale);
  const latency = (ms: number | null) =>
    ms === null
      ? '–'
      : ms >= 1000
        ? fmt(t.admin.aiUsage.latencySeconds, { value: (ms / 1000).toFixed(1) })
        : fmt(t.admin.aiUsage.latencyMs, { value: ms });

  return (
    <div>
      <PageHeader title={t.admin.aiUsage.title} subtitle={t.admin.aiUsage.subtitle} />
      <AdminNav current="/admin/ai-usage" />

      <Notice tone={configured ? 'success' : 'info'} className="mb-6 flex items-center gap-2">
        <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
        {configured ? t.admin.aiUsage.configured : t.admin.aiUsage.demo}
      </Notice>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.admin.aiUsage.allCalls} value={num(totals.calls)} icon={<Bot className="h-5 w-5" aria-hidden />} />
        <Stat
          label={t.admin.aiUsage.realVsDemo}
          value={`${num(totals.real)} / ${num(totals.mock)}`}
          icon={<Sparkles className="h-5 w-5" aria-hidden />}
          tint="lilac"
        />
        <Stat
          label={t.admin.aiUsage.tokensInOut}
          value={`${num(totals.promptTokens)} / ${num(totals.completionTokens)}`}
          tint="butter"
        />
        <Stat
          label={t.admin.aiUsage.avgLatency}
          value={latency(totals.avgLatencyMs)}
          icon={<Clock className="h-5 w-5" aria-hidden />}
          tint="sky"
        />
      </div>

      <Card className="mb-6">
        <CardHeader title={t.admin.aiUsage.callsPerDay} subtitle={fmt(t.admin.aiUsage.callsPerDaySubtitle, { days: 14 })} />
        <CardBody>
          <UsageChart data={report.series} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t.admin.aiUsage.byFeature} subtitle={t.admin.aiUsage.byFeatureSubtitle} />
        <CardBody>
          {report.features.length === 0 ? (
            <EmptyState title={t.admin.aiUsage.emptyTitle}>{t.admin.aiUsage.emptyBody}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="font-display text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.feature}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.calls}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.real}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.demo}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.tokensIn}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.aiUsage.columns.tokensOut}</th>
                    <th scope="col" className="py-2">{t.admin.aiUsage.columns.avgLatency}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.features.map((f) => (
                    <tr key={f.feature} className="border-t-2 border-line/15">
                      <td className="py-2.5 pr-3"><Badge tint="lilac">{f.feature}</Badge></td>
                      <td className="py-2.5 pr-3 font-semibold">{num(f.calls)}</td>
                      <td className="py-2.5 pr-3">{num(f.real)}</td>
                      <td className="py-2.5 pr-3">{num(f.mock)}</td>
                      <td className="py-2.5 pr-3">{num(f.promptTokens)}</td>
                      <td className="py-2.5 pr-3">{num(f.completionTokens)}</td>
                      <td className="py-2.5">{latency(f.avgLatencyMs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
