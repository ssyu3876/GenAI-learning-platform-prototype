// Insights tab: error rate per quiz question plus the AI misconception summary.
import { AlertTriangle, Check, Lightbulb, ListChecks, Target, UserCheck, WandSparkles } from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, cn, EmptyState, Notice, Pip, ProgressBar, Stat, type Tint } from '@/components/ui';
import { summariseMisconceptions } from '../actions';
import { ATTENTION_RATE, type QuestionInsight } from '../insights';
import { formatLastActive } from '../logic';
import { getClassQuestionInsights, type ClassQuestionInsights } from '../queries';
import { InlineActionForm } from './inline-action-form';

const letter = (i: number) => String.fromCharCode(65 + i);

function rateTint(rate: number): Tint {
  if (rate >= ATTENTION_RATE) return 'coral';
  if (rate >= 25) return 'butter';
  return 'mint';
}

export async function QuestionInsights({ classId }: { classId: string }) {
  const data = await getClassQuestionInsights(classId);
  if (data.totalStudents === 0) {
    return (
      <EmptyState title="No students to learn from yet">
        Once students join and take quizzes, you will see which questions trip them up.
      </EmptyState>
    );
  }
  if (data.questions.length === 0) {
    return (
      <EmptyState title="No quiz answers yet">
        When students finish a quiz in one of this class&apos;s courses, each question&apos;s error rate shows up here.
      </EmptyState>
    );
  }

  const flagged = data.questions.filter((q) => q.errorRate >= ATTENTION_RATE && q.answered > 1).length;
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Quiz answers" value={data.answerCount} icon={<ListChecks className="h-5 w-5" aria-hidden />} tint="sky" />
        <Stat
          label="Avg error rate"
          value={data.averageErrorRate === null ? '–' : `${data.averageErrorRate}%`}
          icon={<Target className="h-5 w-5" aria-hidden />}
          tint="lilac"
        />
        <Stat
          label={`Missed by ${ATTENTION_RATE}%+`}
          value={flagged}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
          tint="coral"
        />
        <Stat
          label="Students answering"
          value={`${data.studentsWithAnswers} / ${data.totalStudents}`}
          icon={<UserCheck className="h-5 w-5" aria-hidden />}
          tint="mint"
        />
      </div>

      <MisconceptionCard classId={classId} data={data} />

      <Card>
        <CardHeader title="Question by question" subtitle="Based on each student's latest try. Most missed first." />
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

function MisconceptionCard({ classId, data }: { classId: string; data: ClassQuestionInsights }) {
  const summary = data.summary;
  const newAnswers = summary ? data.answerCount - summary.answerCount : 0;
  return (
    <Card tint="lilac">
      <CardHeader
        title="Common misconceptions"
        subtitle={
          summary
            ? `Based on ${summary.answerCount} answers · updated ${formatLastActive(summary.generatedAt).toLowerCase()}`
            : 'Pip reads the wrong answers and groups them into the ideas students are mixing up.'
        }
        action={
          <InlineActionForm action={summariseMisconceptions} fields={{ classId }} pendingText="Reading answers…">
            <WandSparkles className="h-4 w-4" aria-hidden /> {summary ? 'Refresh summary' : 'Summarise'}
          </InlineActionForm>
        }
      />
      <CardBody className="flex flex-col gap-4">
        {!summary ? (
          <div className="flex items-center gap-3">
            <Pip mood="think" size={56} />
            <p className="text-sm text-ink-soft">
              No summary yet. It only looks at answers, never at names, and you can refresh it after each quiz.
            </p>
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
                          <li key={p}>Seen in: {p}</li>
                        ))}
                      </ul>
                    ) : null}
                    {m.tip ? (
                      <p className="flex gap-2 rounded-lg bg-butter-soft px-3 py-2 text-sm">
                        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                        <span>
                          <span className="sr-only">Teaching tip: </span>
                          {m.tip}
                        </span>
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : null}
            {summary.mocked ? (
              <Notice tone="info">Demo summary built from the numbers only. Add an AI key for a written one.</Notice>
            ) : null}
            {newAnswers > 0 ? (
              <p className="text-sm text-ink-soft">
                {newAnswers} new answer{newAnswers === 1 ? '' : 's'} since this summary.
              </p>
            ) : null}
          </>
        )}
      </CardBody>
    </Card>
  );
}

function QuestionLine({ question: q }: { question: QuestionInsight }) {
  const top = q.topWrong;
  return (
    <li className="flex flex-col gap-2 border-t-2 border-line/15 py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-soft">
          <span aria-hidden>{q.course.emoji}</span> {q.lessonTitle} · {q.activityTitle} · Q{q.questionIndex + 1}
        </span>
        <Badge tint={rateTint(q.errorRate)}>
          {q.errorRate >= ATTENTION_RATE ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden /> : null}
          {q.errorRate}% wrong
        </Badge>
      </div>
      <p className="font-semibold">{q.prompt}</p>
      <div className="flex items-center gap-3">
        <ProgressBar value={q.errorRate} tint={rateTint(q.errorRate)} label={`Error rate for: ${q.prompt}`} size="sm" />
        <span className="w-24 shrink-0 text-right text-sm font-semibold">
          {q.wrong} of {q.answered} wrong
        </span>
      </div>
      {top ? (
        <p className="text-sm">
          <span className="text-ink-soft">Most common wrong pick:</span>{' '}
          <strong>
            {letter(top.index)}. {q.options[top.index]}
          </strong>{' '}
          <span className="text-ink-soft">
            ({top.count} student{top.count === 1 ? '' : 's'})
          </span>
        </p>
      ) : null}
      <details className="group">
        <summary className="w-fit cursor-pointer rounded-lg text-sm font-semibold text-ink-soft hover:text-ink">
          See every option
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
                  {isAnswer ? <Check className="h-3.5 w-3.5" aria-label="Right answer" /> : letter(i)}
                </span>
                <span>{opt}</span>
                <ProgressBar value={share} tint={isAnswer ? 'mint' : 'coral'} label={`Share who picked ${letter(i)}`} size="sm" />
                <span className="text-right font-semibold">{q.picks[i]}</span>
              </li>
            );
          })}
        </ul>
      </details>
    </li>
  );
}
