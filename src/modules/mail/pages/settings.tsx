// /mail/settings: per-user notification switches.
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { MAIL_EVENTS_BY_ROLE } from '@/core/mail/notify';
import { buttonClasses, Card, CardBody, Field, Notice, PageHeader } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { getT } from '@/i18n';
import { saveMailPreferences } from '../actions';
import { getMailPreferences } from '../queries';

export async function MailSettingsPage({ user }: { user: SessionUser }) {
  const { t } = await getT();
  const preferences = await getMailPreferences(user.id);
  const events = MAIL_EVENTS_BY_ROLE[user.role];

  return (
    <div>
      <PageHeader
        title={t.mail.settings.title}
        subtitle={t.mail.settings.subtitle}
        eyebrow={
          <Link href="/mail" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.mail.backToInbox}
          </Link>
        }
      />
      <Card>
        <CardBody>
          {events.length === 0 ? (
            <Notice>{t.mail.settings.adminNoOptions}</Notice>
          ) : (
            <form action={saveMailPreferences} className="flex flex-col gap-4">
              {events.map((event) => {
                const hint =
                  event === 'courseOffline' && user.role === 'learner'
                    ? t.mail.settings.courseOfflineHintLearner
                    : t.mail.settings[`${event}Hint`];
                return (
                  <Field key={event} label={t.mail.settings[event]} hint={hint}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={event}
                        defaultChecked={preferences[event]}
                        className="h-4 w-4 accent-coral"
                      />
                      {t.mail.settings.enable}
                    </label>
                  </Field>
                );
              })}
              <div>
                <SubmitButton pendingText={t.chrome.common.saving}>{t.chrome.common.save}</SubmitButton>
              </div>
            </form>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
