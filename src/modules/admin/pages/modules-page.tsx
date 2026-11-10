// /admin/modules: the feature modules in this build. The route passes plain data in so this
// module never imports the registry.
import { Boxes } from 'lucide-react';
import { Badge, Card, EmptyState, PageHeader } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { navLabelForText } from '@/i18n/nav';
import { AdminNav } from '../components/admin-nav';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  owner: string | null;
  navLabels: string[];
  widgetCount: number;
  addonCount: number;
}

export async function AdminModulesPage({ modules }: { modules: ModuleInfo[] }) {
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t.admin.modules.title} subtitle={t.admin.modules.subtitle} />
      <AdminNav current="/admin/modules" />
      {modules.length === 0 ? (
        <EmptyState title={t.admin.modules.empty} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {modules.map((m) => {
            const name = t.admin.modulesMeta.names[m.id as keyof typeof t.admin.modulesMeta.names] ?? m.name;
            const description =
              t.admin.modulesMeta.descriptions[m.id as keyof typeof t.admin.modulesMeta.descriptions] ?? m.description;
            const labels = m.navLabels.map((label) => navLabelForText(label, t)).join(t.admin.modules.listSeparator);
            return (
            <li key={m.id}>
              <Card className="h-full p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-line bg-sky-soft">
                    <Boxes className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold">{name}</h2>
                    <code className="text-xs text-ink-soft">{m.id}</code>
                  </div>
                </div>
                <p className="mt-3 text-sm">{description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tint="butter">
                    {m.navLabels.length
                      ? fmt(
                          plural(m.navLabels.length, t.admin.modules.navItemsWithLabelsOne, t.admin.modules.navItemsWithLabelsMany),
                          { count: m.navLabels.length, labels },
                        )
                      : fmt(plural(m.navLabels.length, t.admin.modules.navItemsOne, t.admin.modules.navItemsMany), {
                          count: m.navLabels.length,
                        })}
                  </Badge>
                  <Badge tint="mint">
                    {fmt(plural(m.widgetCount, t.admin.modules.widgetOne, t.admin.modules.widgetMany), { count: m.widgetCount })}
                  </Badge>
                  {m.addonCount ? (
                    <Badge tint="lilac">
                      {fmt(plural(m.addonCount, t.admin.modules.addonOne, t.admin.modules.addonMany), { count: m.addonCount })}
                    </Badge>
                  ) : null}
                  {m.owner ? <Badge tint="paper">{fmt(t.admin.modules.owner, { owner: m.owner })}</Badge> : null}
                </div>
              </Card>
            </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
