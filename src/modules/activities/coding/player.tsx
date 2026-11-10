'use client';

import { javascript } from '@codemirror/lang-javascript';
import { Check, Lightbulb, Play, RotateCcw, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn, Markdown, Notice, PipSays } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { useCompletion } from '../components/use-completion';
import { getCodingHint } from './actions';
import { runTests, type RunOutput } from './runner';
import type { CodingConfig } from './schema';

// CodeMirror touches `document`, so load it only in the browser.
const CodeMirror = dynamic(() => import('@uiw/react-codemirror'), {
  ssr: false,
  loading: () => <div className="h-56 animate-pulse rounded-xl border-2 border-line bg-ink/90" />,
});

export function CodingPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<CodingConfig>) {
  const t = useT();
  const [code, setCode] = useState(config.starterCode);
  const [run, setRun] = useState<RunOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const passed = run?.results.filter((r) => r.passed).length ?? 0;
  const total = config.tests.length;
  const score = Math.round((passed / total) * 100);

  async function onRun() {
    setRunning(true);
    setRun(await runTests(code, config.functionName, config.tests));
    setRunning(false);
  }

  async function onHint() {
    setHintLoading(true);
    const failing = (run?.results ?? []).filter((r) => !r.passed).map((r) => `${r.label}: expected ${r.expected}, got ${r.actual}`);
    const res = await getCodingHint({ activityId: activity.id, code, failing });
    setHint(res.hint);
    setHintLoading(false);
  }

  function onSubmit() {
    setSubmitted(true);
    void submit({ score, detail: { code, passed, total } });
  }

  function retry() {
    setSubmitted(false);
    reset();
  }

  return (
    <ActivityFrame kind={t.activities.frame.coding} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview} tint="sky">
      {submitted ? (
        <ResultPanel score={score} outcome={outcome} submitting={submitting} error={error} preview={preview} onRetry={retry}>
          <p className="text-ink-soft">{fmt(t.activities.coding.scoreLine, { passed, total })}</p>
        </ResultPanel>
      ) : (
        <div className="flex flex-col gap-4">
          <Markdown>{config.instructions}</Markdown>

          <div className="overflow-hidden rounded-xl border-2 border-line shadow-sticker-sm">
            <div className="flex items-center justify-between border-b-2 border-line bg-ink px-3 py-1.5 text-xs font-semibold text-cream">
              <span>solution.js</span>
              <button type="button" onClick={() => setCode(config.starterCode)} className="flex items-center gap-1 opacity-80 hover:opacity-100">
                <RotateCcw className="h-3 w-3" /> {t.activities.coding.reset}
              </button>
            </div>
            <CodeMirror
              value={code}
              onChange={setCode}
              extensions={[javascript()]}
              theme="dark"
              minHeight="14rem"
              basicSetup={{ lineNumbers: true, foldGutter: false }}
              aria-label={t.activities.coding.editorLabel}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="mint" onClick={onRun} disabled={running}>
              <Play className="h-4 w-4" /> {running ? t.activities.coding.running : t.activities.coding.runTests}
            </Button>
            <Button variant="secondary" onClick={onHint} disabled={hintLoading}>
              <Lightbulb className="h-4 w-4" /> {hintLoading ? t.activities.coding.pipThinking : t.activities.coding.askHint}
            </Button>
            <Button className="ml-auto" onClick={onSubmit} disabled={!run || running}>
              {fmt(t.activities.coding.submit, { passed, total })}
            </Button>
          </div>

          {hint ? (
            <PipSays mood="think" size={56}>
              <Markdown className="text-sm">{hint}</Markdown>
            </PipSays>
          ) : null}

          {run?.fatal ? <Notice tone="error">{run.fatal}</Notice> : null}
          {run && !run.fatal ? (
            <ul className="flex flex-col gap-1.5" aria-live="polite" aria-label={t.activities.coding.testResults}>
              {run.results.map((r, i) => (
                <li key={i} className={cn('flex items-start gap-2 rounded-lg border-2 border-line px-3 py-2 text-sm', r.passed ? 'bg-mint-soft' : 'bg-coral-soft')}>
                  {r.passed ? <Check className="mt-0.5 h-4 w-4 shrink-0" aria-label={t.activities.coding.passed} /> : <X className="mt-0.5 h-4 w-4 shrink-0" aria-label={t.activities.coding.failed} />}
                  <div className="min-w-0">
                    <code className="font-mono font-semibold break-all">{r.label}</code>
                    {!r.passed ? (
                      <div className="font-mono text-xs break-all">
                        {r.error
                          ? fmt(t.activities.coding.expected, { expected: r.expected, actual: fmt(t.activities.coding.error, { error: r.error }) })
                          : fmt(t.activities.coding.expected, { expected: r.expected, actual: r.actual ?? '' })}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
          {run?.logs.length ? (
            <pre className="max-h-32 overflow-auto rounded-lg bg-ink p-2 font-mono text-xs text-cream">{run.logs.join('\n')}</pre>
          ) : null}
        </div>
      )}
    </ActivityFrame>
  );
}
