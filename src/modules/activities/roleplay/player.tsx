'use client';

// Role-play: chat with an AI character (client, interviewer, teammate), then get scored
// against a rubric. Used as the "apply what you learned" check at the end of a lesson.
import { MessagesSquare, Send, Square, Target } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Avatar, Badge, Button, cn, Notice, Pip, ProgressBar, Textarea } from '@/components/ui';
import { useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { useCompletion } from '../components/use-completion';
import { scoreRoleplay } from './actions';
import type { RoleplayConfig, RoleplayFeedback, RoleplayMessage } from './schema';

type Stage = 'intro' | 'chat' | 'scoring' | 'done';

export function RoleplayPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<RoleplayConfig>) {
  const t = useT();
  const [stage, setStage] = useState<Stage>('intro');
  const [messages, setMessages] = useState<RoleplayMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<RoleplayFeedback | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const learnerTurns = messages.filter((m) => m.role === 'learner').length;
  const outOfTurns = learnerTurns >= config.maxTurns;

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function start() {
    setMessages([{ role: 'persona', content: config.opening }]);
    setStage('chat');
  }

  async function send() {
    const text = draft.trim();
    if (!text || streaming || outOfTurns) return;
    const next: RoleplayMessage[] = [...messages, { role: 'learner', content: text }];
    setMessages([...next, { role: 'persona', content: '' }]);
    setDraft('');
    setStreaming(true);
    setChatError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const res = await fetch('/api/activities/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityId: activity.id, messages: next }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(await res.text());
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let reply = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...next, { role: 'persona', content: reply }]);
      }
      if (!reply.trim()) setMessages([...next, { role: 'persona', content: '…' }]);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setChatError(fmt(t.activities.roleplay.noAnswer, { persona: config.persona }));
        setMessages(next);
      }
    } finally {
      setStreaming(false);
    }
  }

  async function finish() {
    abortRef.current?.abort();
    setStage('scoring');
    try {
      const fb = await scoreRoleplay({ activityId: activity.id, messages: messages.filter((m) => m.content.trim()) });
      setFeedback(fb);
      setStage('done');
      void submit({ score: fb.overall, detail: { feedback: fb, turns: learnerTurns } });
    } catch {
      setChatError(t.activities.roleplay.scoringFailed);
      setStage('chat');
    }
  }

  function retry() {
    setMessages([]);
    setFeedback(null);
    setStage('intro');
    reset();
  }

  return (
    <ActivityFrame kind={t.activities.frame.roleplay} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview} tint="lilac">
      {stage === 'intro' ? (
        <div className="flex flex-col gap-4">
          <p className="text-lg">{config.scenario}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-line bg-paper p-3">
              <div className="text-xs font-bold text-ink-soft uppercase">{t.activities.roleplay.talkingTo}</div>
              <div className="mt-1 flex items-center gap-2">
                <Avatar seed={config.persona} name={config.persona} size={36} />
                <div>
                  <div className="font-display font-bold">{config.persona}</div>
                  <div className="text-sm text-ink-soft">{config.personaRole}</div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border-2 border-line bg-paper p-3">
              <div className="text-xs font-bold text-ink-soft uppercase">{t.activities.roleplay.youPlay}</div>
              <div className="mt-1 font-display font-bold">{config.learnerRole}</div>
              <div className="text-sm text-ink-soft">{fmt(t.activities.roleplay.upToMessages, { count: config.maxTurns })}</div>
            </div>
          </div>
          <div className="rounded-xl border-2 border-line bg-butter-soft p-3">
            <div className="mb-1 flex items-center gap-1.5 font-display font-bold">
              <Target className="h-4 w-4" /> {t.activities.roleplay.goals}
            </div>
            <ul className="list-disc pl-5">
              {config.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-ink-soft">
              {fmt(t.activities.roleplay.scoredOn, { criteria: config.rubric.map((r) => r.criterion).join('、') })}
            </p>
          </div>
          <div>
            <Button onClick={start}>
              <MessagesSquare className="h-4 w-4" /> {t.activities.roleplay.start}
            </Button>
          </div>
        </div>
      ) : null}

      {stage === 'chat' || stage === 'scoring' ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold text-ink-soft">
              {fmt(t.activities.roleplay.messagesCount, { used: learnerTurns, max: config.maxTurns })}
            </span>
            <ProgressBar value={(learnerTurns / config.maxTurns) * 100} label={t.activities.roleplay.conversationLength} size="sm" tint="lilac" className="flex-1" />
          </div>
          <div ref={listRef} className="flex max-h-[26rem] min-h-56 flex-col gap-3 overflow-y-auto rounded-xl border-2 border-line bg-paper p-3" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={cn('flex items-end gap-2', m.role === 'learner' && 'flex-row-reverse')}>
                {m.role === 'persona' ? <Avatar seed={config.persona} name={config.persona} size={30} /> : null}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl border-2 border-line px-3 py-2',
                    m.role === 'persona' ? 'rounded-bl-sm bg-lilac-soft' : 'rounded-br-sm bg-butter-soft',
                  )}
                >
                  <div className="text-xs font-bold text-ink-soft">{m.role === 'persona' ? config.persona : t.activities.roleplay.you}</div>
                  {m.content || <span className="animate-pulse">{t.activities.roleplay.typing}</span>}
                </div>
              </div>
            ))}
          </div>
          {chatError ? <Notice tone="error">{chatError}</Notice> : null}
          {stage === 'scoring' ? (
            <div className="flex items-center gap-3">
              <Pip mood="think" size={48} className="animate-wiggle" />
              <span className="font-semibold">{t.activities.roleplay.reviewing}</span>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <label htmlFor={`rp-${activity.id}`} className="sr-only">
                {t.activities.roleplay.yourMessage}
              </label>
              <Textarea
                id={`rp-${activity.id}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder={outOfTurns ? t.activities.roleplay.outOfTurns : fmt(t.activities.roleplay.replyTo, { persona: config.persona })}
                disabled={outOfTurns || streaming}
                className="min-h-14 flex-1"
                rows={2}
              />
              <div className="flex gap-2">
                <Button type="submit" variant="mint" disabled={!draft.trim() || streaming || outOfTurns}>
                  <Send className="h-4 w-4" /> {t.activities.roleplay.send}
                </Button>
                <Button variant={outOfTurns ? 'primary' : 'secondary'} onClick={finish} disabled={learnerTurns === 0 || streaming}>
                  <Square className="h-4 w-4" /> {t.activities.roleplay.endAndFeedback}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {stage === 'done' && feedback ? (
        <ResultPanel score={feedback.overall} outcome={outcome} submitting={submitting} error={error} preview={preview} onRetry={retry}>
          <div className="grid gap-2">
            {feedback.criteria.map((c) => (
              <div key={c.criterion} className="rounded-xl border-2 border-line bg-paper p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display font-bold">{c.criterion}</span>
                  <Badge tint={c.score >= 70 ? 'mint' : c.score >= 45 ? 'butter' : 'coral'}>{c.score}</Badge>
                </div>
                <ProgressBar value={c.score} label={c.criterion} size="sm" className="my-2" tint={c.score >= 70 ? 'mint' : 'butter'} />
                <p className="text-sm">{c.comment}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-line bg-mint-soft p-3">
              <div className="font-display font-bold">{t.activities.roleplay.whatWentWell}</div>
              <ul className="mt-1 list-disc pl-5 text-sm">{feedback.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
            <div className="rounded-xl border-2 border-line bg-coral-soft p-3">
              <div className="font-display font-bold">{t.activities.roleplay.tryNextTime}</div>
              <ul className="mt-1 list-disc pl-5 text-sm">{feedback.improve.map((s) => <li key={s}>{s}</li>)}</ul>
            </div>
          </div>
          <p className="rounded-xl border-2 border-dashed border-line/50 p-3 text-sm">
            <strong>{t.activities.roleplay.pipTip}</strong> {feedback.tip}
          </p>
        </ResultPanel>
      ) : null}
    </ActivityFrame>
  );
}
