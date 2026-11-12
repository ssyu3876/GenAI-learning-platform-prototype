// Admin view of scenario usage, for /admin/scenarios.
//
// Read-only on purpose: scenario content is TypeScript source, not data an admin edits.
// The panels show what actually happens in the dungeon, not how it is written.
import { Badge, Card, CardBody, EmptyState } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { getScenarioOps } from './queries';
import { ScenarioToggle } from './scenario-toggle';

export async function ScenarioOps() {
  const { locale, t } = await getT();
  const { summary, rows } = await getScenarioOps(locale);
  const dateLocale = locale === 'zh' ? 'zh-CN' : 'en-GB';
  const dateLabel = (d: Date | null) =>
    d ? d.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' }) : t.admin.scenarios.never;

  const untouched = rows.filter((row) => row.runs === 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.scenarios.startedRuns}</p>
          <p className="font-display text-2xl font-bold">{summary.runs}</p>
          <p className="text-sm text-ink-soft">{fmt(t.admin.scenarios.byPeople, { count: summary.learners })}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.scenarios.finishedRuns}</p>
          <p className="font-display text-2xl font-bold">{summary.finished}</p>
          <p className="text-sm text-ink-soft">
            {summary.runs === 0
              ? '—'
              : `${Math.round((summary.finished / summary.runs) * 100)}% ${t.admin.scenarios.finishRate}`}
          </p>
        </Card>
        <Card tint={untouched ? 'butter' : 'paper'} className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.scenarios.untouched}</p>
          <p className="font-display text-2xl font-bold">
            {untouched}
            <span className="text-base font-normal text-ink-soft"> / {rows.length}</span>
          </p>
          <p className="text-sm text-ink-soft">{t.admin.scenarios.untouchedHint}</p>
        </Card>
      </div>

      <Card>
        <CardBody className="pt-5">
          {rows.length === 0 ? (
            <EmptyState title={t.admin.scenarios.emptyTitle}>{t.admin.scenarios.emptyBody}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead className="font-display text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.scenario}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.learners}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.started}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.finished}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.avgBest}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.scenarios.columns.lastPlayed}</th>
                    <th scope="col" className="py-2">{t.admin.scenarios.columns.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.key} className="border-t-2 border-line/15">
                      <td className="py-2.5 pr-3">
                        <span className="font-semibold">{row.title}</span>
                        {row.closed ? (
                          <Badge tint="coral" className="ml-2">{t.admin.scenarios.closedBadge}</Badge>
                        ) : null}
                        {row.title === row.key ? (
                          <Badge tint="paper" className="ml-2">{t.admin.scenarios.retired}</Badge>
                        ) : null}
                        <code className="block text-xs text-ink-soft">{row.key}</code>
                      </td>
                      <td className="py-2.5 pr-3">{row.learners}</td>
                      <td className="py-2.5 pr-3">{row.runs}</td>
                      <td className="py-2.5 pr-3">
                        {row.finished}
                        {row.completions !== row.finished ? (
                          <span className="text-ink-soft"> ({row.completions})</span>
                        ) : null}
                      </td>
                      <td className="py-2.5 pr-3">{row.runs ? row.avgBest : '—'}</td>
                      <td className="py-2.5 pr-3">{dateLabel(row.lastPlayedAt)}</td>
                      <td className="py-2.5">
                        <ScenarioToggle scenarioKey={row.key} name={row.title} closed={row.closed} />
                      </td>
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
