// What this build ships. This used to be /admin/modules, a whole page of read-only cards
// that an admin could not act on; it is build information, so it sits at the bottom of the
// overview instead of taking a slot in the section nav.
import { Boxes } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { fmt, getT, plural } from '@/i18n';
import { navLabelForText } from '@/i18n/nav';

export interface ModuleInfo {
  id: string;
  name: string;
  description: string;
  owner: string | null;
  navLabels: string[];
  widgetCount: number;
  addonCount: number;
}

export async function AdminModuleList({ modules }: { modules: ModuleInfo[] }) {
  const { t } = await getT();
  if (modules.length === 0) {
    return <p className="text-sm text-ink-soft">{t.admin.modules.empty}</p>;
  }

  return (
    <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => {
        const name = t.admin.modulesMeta.names[m.id as keyof typeof t.admin.modulesMeta.names] ?? m.name;
        const description =
          t.admin.modulesMeta.descriptions[m.id as keyof typeof t.admin.modulesMeta.descriptions] ?? m.description;
        const labels = m.navLabels.map((label) => navLabelForText(label, t)).join(t.admin.modules.listSeparator);
        return (
          <li key={m.id}>
            <Card className="h-full p-4">
              <div className="flex items-start gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 border-line bg-sky-soft">
                  <Boxes className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-bold leading-tight">{name}</h3>
                  <code className="text-xs text-ink-soft">{m.id}</code>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink-soft">{description}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
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
  );
}
