import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import type { HomeWidgetProps } from '@/core/types';
import { buttonClasses, Card, CardBody, CardHeader, Pip } from '@/components/ui';
import { formatDue } from '../logic';
import { getReviewOverview } from '../queries';

export async function ReviewWidget({ user }: HomeWidgetProps) {
  const data = await getReviewOverview(user.id);
  const hasCards = data.notebook.length > 0;

  return (
    <Card tint={data.dueCount > 0 ? 'butter' : 'paper'} className="h-full">
      <CardHeader
        title="Review"
        subtitle={hasCards ? `${data.inRotation} in rotation · ${data.masteredCount} mastered` : undefined}
      />
      <CardBody className="flex items-center gap-4">
        <Pip mood={data.dueCount > 0 ? 'think' : 'happy'} size={64} />
        <div className="flex min-w-0 flex-col gap-2">
          {data.dueCount > 0 ? (
            <>
              <p className="font-display text-xl font-bold">
                {data.dueCount} question{data.dueCount === 1 ? '' : 's'} to try again
              </p>
              <p className="text-sm text-ink-soft">You missed these in a quiz. A couple of minutes is enough.</p>
              <Link href="/review" className={buttonClasses('mint', 'sm', 'self-start')}>
                <RotateCcw className="h-4 w-4" aria-hidden /> Start review
              </Link>
            </>
          ) : hasCards ? (
            <p className="text-sm">
              All caught up.
              {data.nextDueAt ? ` Next card is due ${formatDue(data.nextDueAt, new Date())}.` : ' Everything is mastered.'}
            </p>
          ) : (
            <p className="text-sm text-ink-soft">
              Quiz questions you miss come back here a day later for a second try.
            </p>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
