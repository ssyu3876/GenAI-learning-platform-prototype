// Admin section for classes. The leaderboard switch lives here because it is a class setting,
// and because an admin should not have to open a learner page to find it.
import { Badge, Button, Card, CardBody, EmptyState } from '@/components/ui';
import { getT } from '@/i18n';
import { setClassBoard } from '../actions';
import { listClassesForAdmin } from './queries';

export async function AdminClassesPanel() {
  const { t } = await getT();
  const rows = await listClassesForAdmin();

  return (
    <Card>
      <CardBody className="pt-5">
        {rows.length === 0 ? (
          <EmptyState title={t.admin.classes.emptyTitle}>{t.admin.classes.emptyBody}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="font-display text-ink-soft">
                <tr>
                  <th scope="col" className="py-2 pr-3">{t.admin.classes.columns.name}</th>
                  <th scope="col" className="py-2 pr-3">{t.admin.classes.columns.instructor}</th>
                  <th scope="col" className="py-2 pr-3">{t.admin.classes.columns.students}</th>
                  <th scope="col" className="py-2 pr-3">{t.admin.classes.columns.courses}</th>
                  <th scope="col" className="py-2 pr-3">{t.admin.classes.columns.board}</th>
                  <th scope="col" className="py-2">{t.admin.classes.columns.action}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t-2 border-line/15">
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold">{row.name}</div>
                      <div className="text-xs text-ink-soft">
                        {t.admin.classes.invite}: {row.inviteCode}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">{row.instructorName}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{row.members}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{row.courses}</td>
                    <td className="py-2.5 pr-3">
                      <Badge tint={row.boardVisible ? 'mint' : 'butter'}>
                        {row.boardVisible ? t.admin.classes.boardVisible : t.admin.classes.boardHidden}
                      </Badge>
                    </td>
                    <td className="py-2.5">
                      <form action={setClassBoard}>
                        <input type="hidden" name="classId" value={row.id} />
                        <input type="hidden" name="enabled" value={String(!row.boardVisible)} />
                        <Button type="submit" size="sm" variant="secondary">
                          {row.boardVisible ? t.admin.classes.hide : t.admin.classes.show}
                        </Button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
