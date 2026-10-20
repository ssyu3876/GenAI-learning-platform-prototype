'use client';

import { useTransition } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui';
import { startScenario } from '../actions';

/** Starts (or resumes) a choice scenario. Kept tiny so the page itself stays a server component. */
export function StartPanel({ scenarioKey }: { scenarioKey: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="primary"
      size="lg"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await startScenario({ key: scenarioKey });
        })
      }
    >
      <Play className="h-5 w-5" aria-hidden /> {isPending ? 'Starting...' : 'Start'}
    </Button>
  );
}
