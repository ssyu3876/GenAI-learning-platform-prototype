// Admin view of badge reach, for /admin/badges.
//
// Badges are predicates, not rows, so there is nothing to edit: this shows how many learners
// currently satisfy each one. A badge nobody has is either too hard or broken; a badge
// everybody has tells you nothing. Both are worth seeing.
import { Badge, Card, CardBody, EmptyState } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { getBadgeDistribution } from '../queries';

export async function BadgeOps() {
  const { t } = await getT();
  const report = await getBadgeDistribution();
  const share = (count: number) => (report.learners === 0 ? 0 : Math.round((count / report.learners) * 100));
  const never = report.rows.filter((row) => row.earnedBy === 0).length;
  const everyone = report.rows.filter((row) => row.earnedBy === report.learners && report.learners > 0).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.badges.learners}</p>
          <p className="font-display text-2xl font-bold">{report.learners}</p>
          <p className="text-sm text-ink-soft">{fmt(t.admin.badges.activeHint, { count: report.activeLearners })}</p>
        </Card>
        <Card tint={never ? 'butter' : 'paper'} className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.badges.neverEarned}</p>
          <p className="font-display text-2xl font-bold">
            {never}
            <span className="text-base font-normal text-ink-soft"> / {report.rows.length}</span>
          </p>
          <p className="text-sm text-ink-soft">{t.admin.badges.neverHint}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-bold text-ink-soft uppercase">{t.admin.badges.everyoneHas}</p>
          <p className="font-display text-2xl font-bold">{everyone}</p>
          <p className="text-sm text-ink-soft">{t.admin.badges.everyoneHint}</p>
        </Card>
      </div>

      <Card>
        <CardBody className="pt-5">
          {report.learners === 0 ? (
            <EmptyState title={t.admin.badges.emptyTitle}>{t.admin.badges.emptyBody}</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-left text-sm">
                <thead className="font-display text-ink-soft">
                  <tr>
                    <th scope="col" className="py-2 pr-3">{t.admin.badges.columns.badge}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.badges.columns.group}</th>
                    <th scope="col" className="py-2 pr-3">{t.admin.badges.columns.earnedBy}</th>
                    <th scope="col" className="py-2">{t.admin.badges.columns.share}</th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row) => {
                    const copy = t.achievements.badges[row.id];
                    const percent = share(row.earnedBy);
                    return (
                      <tr key={row.id} className="border-t-2 border-line/15">
                        <td className="py-2.5 pr-3">
                          <span className="font-semibold">{copy.name}</span>
                          {row.earnedBy === 0 ? (
                            <Badge tint="coral" className="ml-2">{t.admin.badges.never}</Badge>
                          ) : null}
                          <span className="block text-xs text-ink-soft">{copy.description}</span>
                        </td>
                        <td className="py-2.5 pr-3 text-ink-soft">{t.achievements.groups[row.group]}</td>
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {row.earnedBy}
                          <span className="text-ink-soft"> / {report.learners}</span>
                        </td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-28 overflow-hidden rounded-pill border-2 border-line/30 bg-paper">
                              <span
                                className="block h-full rounded-pill bg-mint"
                                style={{ width: `${Math.max(percent, row.earnedBy > 0 ? 4 : 0)}%` }}
                              />
                            </span>
                            <span className="text-xs font-semibold tabular-nums">{percent}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
