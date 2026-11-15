// /tutor/history: the learner's persisted AI-tutoring threads.
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, EmptyState, Markdown, PageHeader } from '@/components/ui';
import { fmt, getT } from '@/i18n';
import { ResumeTutorButton } from '../components/resume-tutor-button';
import { listTutorHistory } from '../history';

export async function TutorHistoryPage({ user }: { user: SessionUser }) {
  const { locale, t } = await getT();
  const sessions = await listTutorHistory(user.id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <PageHeader
        eyebrow={
          <Link href="/home" className={buttonClasses('ghost', 'sm', '-ml-3')}>
            <ArrowLeft className="h-4 w-4" aria-hidden /> {t.chrome.nav.home}
          </Link>
        }
        title={t.aiTutor.historyPage.title}
        subtitle={t.aiTutor.historyPage.subtitle}
      />
      {sessions.length === 0 ? (
        <EmptyState title={t.aiTutor.historyPage.empty} mood="happy">
          {t.aiTutor.historyPage.emptyHint}
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {sessions.map((session) => (
            <Card key={session.id}>
              <CardBody className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge tint={session.entry === 'review' ? 'butter' : 'paper'}>
                      <History className="h-3.5 w-3.5" /> {t.aiTutor.historyPage.entries[session.entry]}
                    </Badge>
                    <span className="text-xs text-ink-soft">
                      {session.updatedAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="text-xs text-ink-soft">
                    {fmt(t.aiTutor.historyPage.messages, { count: session.messages.length })}
                  </span>
                  <ResumeTutorButton
                    payload={{
                      sessionId: session.id,
                      entry: session.entry,
                      courseId: session.courseId,
                      courseTitle: session.courseTitle ?? '',
                      lessonId: session.lessonId,
                      lessonTitle: session.lessonTitle ?? '',
                      reviewQuestion: session.reviewQuestion,
                      messages: session.messages.map((message) => ({ role: message.role, content: message.content })),
                    }}
                  />
                </div>
                <div>
                  <p className="font-display font-bold">
                    {session.reviewQuestion || session.lessonTitle || session.courseTitle || t.aiTutor.historyPage.general}
                  </p>
                  {session.lessonTitle || session.courseTitle ? (
                    <p className="text-sm text-ink-soft">
                      {[session.courseTitle, session.lessonTitle].filter(Boolean).join(' · ')}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-2">
                  {session.messages.slice(-6).map((message, index) => (
                    <div
                      key={`${session.id}-${index}`}
                      className={`rounded-xl border-2 border-line/40 p-3 text-sm ${
                        message.role === 'user' ? 'bg-sky-soft' : 'bg-paper'
                      }`}
                    >
                      <p className="mb-1 text-xs font-bold text-ink-soft">
                        {message.role === 'user' ? t.aiTutor.historyPage.you : t.aiTutor.historyPage.pip}
                      </p>
                      {message.role === 'assistant' ? (
                        <Markdown className="text-sm">{message.content}</Markdown>
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
