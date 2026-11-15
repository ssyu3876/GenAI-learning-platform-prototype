// /tutor/insights: instructor/admin view of where learners ask Pip for help.
import Link from 'next/link';
import { Bot, MessageCircleQuestion, Sparkles } from 'lucide-react';
import type { SessionUser } from '@/core/types';
import { Badge, buttonClasses, Card, CardBody, EmptyState, PageHeader, Stat } from '@/components/ui';
import { getT } from '@/i18n';
import { listTutorInsights } from '../history';

export async function TutorInsightsPage({
  user,
  scope = 'classes',
}: {
  user: SessionUser;
  scope?: 'classes' | 'courses';
}) {
  const { locale, t } = await getT();
  const data = await listTutorInsights(user, scope);
  const date = (value: Date) =>
    value.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={t.aiTutor.insights.title} subtitle={t.aiTutor.insights.subtitle} />
      {user.role === 'instructor' ? (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/tutor/insights"
            className={buttonClasses(scope === 'classes' ? 'secondary' : 'ghost', 'sm')}
          >
            {t.aiTutor.insights.myClasses}
          </Link>
          <Link
            href="/tutor/insights?scope=courses"
            className={buttonClasses(scope === 'courses' ? 'secondary' : 'ghost', 'sm')}
          >
            {t.aiTutor.insights.myCourses}
          </Link>
        </div>
      ) : null}
      {data.sessions === 0 ? (
        <EmptyState title={t.aiTutor.insights.empty} mood="happy">
          {t.aiTutor.insights.emptyHint}
        </EmptyState>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label={t.aiTutor.insights.sessions} value={data.sessions} icon={<Bot className="h-5 w-5" aria-hidden />} tint="sky" />
            <Stat
              label={t.aiTutor.insights.reviewQuestions}
              value={data.questions}
              icon={<MessageCircleQuestion className="h-5 w-5" aria-hidden />}
              tint="butter"
            />
            <Stat
              label={t.aiTutor.insights.recommendationClicks}
              value={data.recommendationClicks}
              icon={<Sparkles className="h-5 w-5" aria-hidden />}
              tint="mint"
            />
          </div>
          {data.wrongQuestions.length > 0 ? (
            <Card>
              <CardBody className="flex flex-col gap-3">
                <h2 className="font-display text-lg font-bold">{t.aiTutor.insights.wrongQuestions}</h2>
                <ol className="flex flex-col gap-2">
                  {data.wrongQuestions.map((question) => (
                    <li
                      key={`${question.lessonTitle}-${question.prompt}`}
                      className="flex flex-wrap items-start justify-between gap-2 rounded-xl border-2 border-line/40 p-3"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold">{question.prompt}</p>
                        <p className="text-xs text-ink-soft">
                          {question.courseTitle} · {question.lessonTitle}
                        </p>
                      </div>
                      <Badge tint="coral">{question.count}</Badge>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          ) : null}
          <div className="grid items-start gap-5 lg:grid-cols-[1fr_1.15fr]">
            <Card>
              <CardBody className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <Sparkles className="h-5 w-5" aria-hidden /> {t.aiTutor.insights.topLessons}
                </h2>
                <ol className="flex flex-col gap-2">
                  {data.lessons.map((lesson) => (
                    <li key={`${lesson.lessonId ?? lesson.lessonTitle}`} className="rounded-xl border-2 border-line/40 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{lesson.lessonTitle}</p>
                          <p className="text-sm text-ink-soft">{lesson.courseTitle}</p>
                        </div>
                        <Badge tint="butter">{lesson.asked}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-ink-soft">
                        {lesson.lastQuestion} · {date(lesson.lastAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-3">
                <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                  <MessageCircleQuestion className="h-5 w-5" aria-hidden /> {t.aiTutor.insights.recent}
                </h2>
                <ul className="flex flex-col gap-2">
                  {data.recentQuestions.map((question, index) => (
                    <li key={`${question.studentName}-${question.createdAt.toISOString()}-${index}`} className="rounded-xl bg-paper p-3">
                      <p className="text-sm font-semibold">{question.question}</p>
                      <p className="mt-1 text-xs text-ink-soft">
                        {question.studentName} · {question.lessonTitle} · {date(question.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
