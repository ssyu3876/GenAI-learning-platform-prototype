// Insights tab: error rate per quiz question plus the AI misconception summary.
import { AlertTriangle, Check, Lightbulb, ListChecks, Target, UserCheck, WandSparkles } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, cn, EmptyState, Notice, Pip, ProgressBar, Stat, type Tint } from '@/components/ui';
import { fmt, getT, type Locale, type Translations } from '@/i18n';
import { summariseMisconceptions } from '../actions';
import { ATTENTION_RATE, type QuestionInsight } from '../insights';
import { daysSince } from '../logic';
import { getClassQuestionInsights, type ClassQuestionInsights } from '../queries';
import { InlineActionForm } from './inline-action-form';

const letter = (i: number) => String.fromCharCode(65 + i);

function rateTint(rate: number): Tint {
  if (rate >= ATTENTION_RATE) return 'coral';
  if (rate >= 25) return 'butter';
  return 'mint';
}

/** "Today" / "Yesterday" / "3 days ago" / "Never", then a date once it is over a month old. */
function updatedLabel(date: Date, t: Translations, locale: Locale): string {
  const days = daysSince(date);
  if (days === null || days <= 0) return t.classes.time.today;
  if (days === 1) return t.classes.time.yesterday;
  if (days < 30) return fmt(t.classes.time.daysAgo, { days });
  return date.toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export async function QuestionInsights({ classId }: { classId: string }) {
  const { t } = await getT();
  const data = await getClassQuestionInsights(classId);
  if (data.totalStudents === 0) {
    return (
      <EmptyState title={t.classes.insights.emptyNoStudentsTitle}>
        {t.classes.insights.emptyNoStudentsBody}
      </EmptyState>
    );
  }
  if (data.questions.length === 0) {
    return (
      <EmptyState title={t.classes.insights.emptyNoAnswersTitle}>
        {t.classes.insights.emptyNoAnswersBody}
      </EmptyState>
    );
  }

  const flagged = data.questions.filter((q) => q.errorRate >= ATTENTION_RATE && q.answered > 1).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t.classes.insights.statAnswers} value={data.answerCount} icon={<ListChecks className="h-5 w-5" aria-hidden />} tint="sky" />
        <Stat
          label={t.classes.insights.statAverageError}
          value={data.averageErrorRate === null ? '–' : `${data.averageErrorRate}%`}
          icon={<Target className="h-5 w-5" aria-hidden />}
          tint="lilac"
        />
        <Stat
          label={fmt(t.classes.insights.statFlagged, { rate: ATTENTION_RATE })}
          value={flagged}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
          tint="coral"
        />
        <Stat
          label={t.classes.insights.statStudentsAnswering}
          value={`${data.studentsWithAnswers} / ${data.totalStudents}`}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          tint="mint"
        />
      </div>

      <MisconceptionCard classId={classId} data={data} />

      <Card>
        <CardHeader title={t.classes.insights.questionsTitle} subtitle={t.classes.insights.questionsSubtitle} />
        <CardBody>
          <ul>
            {data.questions.map((q) => (
              <QuestionLine key={q.key} question={q} />
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

async function MisconceptionCard({ classId, data }: { classId: string; data: ClassQuestionInsights }) {
  const { t, locale } = await getT();
  const summary = data.summary;
  const newAnswers = summary ? data.answerCount - summary.answerCount : 0;
  const when = summary ? updatedLabel(summary.generatedAt, t, locale) : '';
  const updatedWhen = locale === 'en' ? when.toLowerCase() : when;
  return (
    <Card tint="lilac">
      <CardHeader
        title={t.classes.insights.misconceptionsTitle}
        subtitle={
          summary
            ? fmt(
                summary.answerCount === 1 ? t.classes.insights.summaryBasisOne : t.classes.insights.summaryBasis,
                { count: summary.answerCount, when: updatedWhen },
              )
            : t.classes.insights.summaryPrompt
        }
        action={
          <InlineActionForm action={summariseMisconceptions} fields={{ classId }} pendingText={t.classes.insights.readingAnswers}>
            <WandSparkles className="h-4 w-4" aria-hidden /> {summary ? t.classes.insights.refresh : t.classes.insights.summarise}
          </InlineActionForm>
        }
      />
      <CardBody className="flex flex-col gap-4">
        {!summary ? (
          <div className="flex items-center gap-3">
            <Pip mood="think" size={56} />
            <p className="text-sm text-ink-soft">{t.classes.insights.noSummary}</p>
          </div>
        ) : (
          <>
            <p className="font-semibold">{summary.content.overview}</p>
            {summary.content.misconceptions.length ? (
              <ol className="grid gap-3 md:grid-cols-2">
                {summary.content.misconceptions.map((m, i) => (
                  <li key={i} className="flex flex-col gap-2 rounded-xl border-2 border-line bg-paper p-4">
                    <h4 className="font-display text-lg font-bold">{m.title}</h4>
                    <p className="text-sm">{m.detail}</p>
                    {m.questions.length ? (
                      <ul className="flex flex-col gap-0.5 text-xs text-ink-soft">
                        {m.questions.map((p) => (
                          <li key={p}>{fmt(t.classes.insights.seenIn, { question: p })}</li>
                        ))}
                      </ul>
                    ) : null}
                    {m.tip ? (
                      <p className="flex gap-2 rounded-lg bg-butter-soft px-3 py-2 text-sm">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>
                          <span className="sr-only">{t.classes.insights.teachingTip} </span>
                          {m.tip}
                        </span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {summary.mocked ? (
              <Notice tone="info">{t.classes.insights.demoSummary}</Notice>
            ) : null}
            {newAnswers > 0 ? (
              <p className="text-sm text-ink-soft">
                {newAnswers === 1
                  ? t.classes.insights.newAnswersOne
                  : fmt(t.classes.insights.newAnswers, { count: newAnswers })}
              </p>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}

async function QuestionLine({ question: q }: { question: QuestionInsight }) {
  const { t } = await getT();
  const top = q.topWrong;
  return (
    <li className="flex flex-col gap-2 border-t-2 border-line/15 py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-soft">
          <span aria-hidden>{q.course.emoji}</span>{' '}
          {fmt(t.classes.insights.questionRef, {
            lesson: q.lessonTitle,
            activity: q.activityTitle,
            number: q.questionIndex + 1,
          })}
        </span>
        <Badge tint={rateTint(q.errorRate)}>
          {q.errorRate >= ATTENTION_RATE ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : null}
          {fmt(t.classes.insights.wrongRate, { rate: q.errorRate })}
        </Badge>
      </div>
      <p className="font-semibold">{q.prompt}</p>
      <div className="flex items-center gap-3">
        <ProgressBar
          value={q.errorRate}
          tint={rateTint(q.errorRate)}
          label={fmt(t.classes.insights.errorRateLabel, { prompt: q.prompt })}
          size="sm"
        />
        <span className="w-24 shrink-0 text-right text-sm font-semibold">
          {fmt(t.classes.insights.wrongOf, { wrong: q.wrong, answered: q.answered })}
        </span>
      </div>
      {top ? (
        <p className="text-sm">
          <span className="text-ink-soft">{t.classes.insights.mostCommonWrongPick}</span>{' '}
          <strong>
            {letter(top.index)}. {q.options[top.index]}
          </strong>{' '}
          <span className="text-ink-soft">
            ({top.count} {top.count === 1 ? t.chrome.common.student : t.chrome.common.students})
          </span>
        </p>
      ) : null}
      <details className="group">
        <summary className="w-fit cursor-pointer rounded-lg text-sm font-semibold text-ink-soft hover:text-ink">
          {t.classes.insights.seeEveryOption}
        </summary>
        <ul className="mt-2 flex flex-col gap-1.5">
          {q.options.map((opt, i) => {
            const isAnswer = i === q.answerIndex;
            const share = q.answered ? (q.picks[i]! / q.answered) * 100 : 0;
            return (
              <li
                key={i}
                className={cn(
                  'grid grid-cols-[auto_1fr_5rem_2rem] items-center gap-2 rounded-lg border-2 border-line px-3 py-1.5 text-sm',
                  isAnswer ? 'bg-mint-soft' : 'bg-paper',
                )}
              >
                <span className="grid h-6 w-6 place-items-center rounded-full border-2 border-line bg-paper font-display text-xs">
                  {isAnswer ? <Check className="h-3.5 w-3.5" aria-label={t.classes.insights.rightAnswer} /> : letter(i)}
                </span>
                <span>{opt}</span>
                <ProgressBar
                  value={share}
                  tint={isAnswer ? 'mint' : 'coral'}
                  label={fmt(t.classes.insights.sharePicked, { letter: letter(i) })}
                  size="sm"
                />
                <span className="text-right font-semibold">{q.picks[i]}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
}
