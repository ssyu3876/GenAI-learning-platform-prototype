'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowUp,
  BookOpen,
  Check,
  CornerUpLeft,
  CornerUpRight,
  HelpCircle,
  Mountain,
  Play,
  RotateCcw,
  Sprout,
  Square,
  Wheat,
  X,
} from 'lucide-react';
import { Badge, Button, cn } from '@/components/ui';
import type { FarmCopy } from '../content/farm-lab';
import {
  runFarm,
  tileAt,
  type FarmCommand,
  type FarmQuestion,
  type FarmResult,
} from '../content/farm-engine';

const COMMAND_ICON: Record<FarmCommand, typeof ArrowUp> = {
  forward: ArrowUp,
  left: CornerUpLeft,
  right: CornerUpRight,
  harvest: Wheat,
  plant: Sprout,
};

const MAX_COMMANDS = 12;
const TICK_MS = 420;

export function FarmLab({ copy }: { copy: FarmCopy }) {
  const [levelIndex, setLevelIndex] = useState(0);
  const level = copy.levels[levelIndex]!;
  const [program, setProgram] = useState<FarmCommand[]>([]);
  const [loop, setLoop] = useState(level.suggestedLoop);
  const [frames, setFrames] = useState<FarmResult['frames']>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState<FarmResult | null>(null);
  const [finished, setFinished] = useState<FarmResult | null>(null);

  const [answered, setAnswered] = useState<Set<string>>(() => new Set());
  const [question, setQuestion] = useState<FarmQuestion | null>(null);
  const [choice, setChoice] = useState<number | null>(null);
  const [wrong, setWrong] = useState(false);

  const answeredRef = useRef(answered);
  const cursorRef = useRef(cursor);
  useEffect(() => {
    answeredRef.current = answered;
  }, [answered]);
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const frame = frames[cursor];
  const drone = frame ?? { ...level.start, harvested: 0, planted: 0, note: '' };
  const trail = new Set(frames.slice(0, cursor).map((f) => `${f.x},${f.y}`));
  const mastered = level.questions.filter((q) => answered.has(q.id)).length;
  const weak = level.questions.filter((q) => !answered.has(q.id)).map((q) => q.concept);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const next = cursorRef.current + 1;
      if (next >= frames.length) {
        setPlaying(false);
        setFinished(run);
        return;
      }
      setCursor(next);
      const nextFrame = frames[next]!;
      const tile = tileAt(level, nextFrame.x, nextFrame.y);
      if (tile?.questionId && !answeredRef.current.has(tile.questionId)) {
        const found = level.questions.find((q) => q.id === tile.questionId);
        if (found) {
          setPlaying(false);
          setQuestion(found);
          setChoice(null);
          setWrong(false);
        }
      }
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, frames, level, run]);

  function addCommand(command: FarmCommand) {
    if (program.length >= MAX_COMMANDS) return;
    setProgram((prev) => [...prev, command]);
    setFrames([]);
    setFinished(null);
  }

  function removeAt(index: number) {
    setProgram((prev) => prev.filter((_, i) => i !== index));
    setFrames([]);
    setFinished(null);
  }

  function clearRun() {
    setFrames([]);
    setCursor(0);
    setPlaying(false);
    setRun(null);
    setFinished(null);
    setQuestion(null);
    setChoice(null);
    setWrong(false);
  }

  function resetLevel(nextIndex = levelIndex) {
    const next = copy.levels[nextIndex]!;
    setLevelIndex(nextIndex);
    setProgram([]);
    setLoop(next.suggestedLoop);
    setAnswered(new Set());
    clearRun();
  }

  function start() {
    if (!program.length) return;
    const result = runFarm(level, program, loop);
    setRun(result);
    setFinished(null);
    setQuestion(null);
    setChoice(null);
    setWrong(false);
    const initial = { ...level.start, harvested: 0, planted: 0, note: '' };
    setFrames([initial, ...result.frames]);
    setCursor(0);
    setPlaying(true);
  }

  function stop() {
    setPlaying(false);
    setFinished(run);
  }

  function answer(index: number) {
    if (!question || choice !== null) return;
    setChoice(index);
    if (index === question.answerIndex) {
      setAnswered((prev) => new Set(prev).add(question.id));
    } else {
      setWrong(true);
    }
  }

  function resumeAfterCorrect() {
    setQuestion(null);
    setChoice(null);
    setWrong(false);
    setPlaying(true);
  }

  function retryAll() {
    clearRun();
  }

  const count = level.goal === 'harvest' ? (finished?.harvested ?? drone.harvested) : (finished?.planted ?? drone.planted);

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {copy.levels.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => resetLevel(i)}
              className={cn(
                'rounded-pill border-2 border-line px-3 py-1 text-xs font-semibold transition-colors',
                i === levelIndex ? 'bg-coral text-ink' : 'bg-paper text-ink-soft hover:bg-cream',
              )}
            >
              {copy.labels.levelLabel} {i + 1}
            </button>
          ))}
          <Badge tint="mint">
            {copy.labels.goal}: {count}/{level.target}
          </Badge>
          <Badge tint="lilac">
            {copy.labels.mastered}: {mastered}/{level.questions.length}
          </Badge>
        </div>

        <div className="rounded-blob border-2 border-line bg-sky-soft p-3 shadow-sticker-sm">
          <p className="font-display font-bold">{level.name}</p>
          <p className="mt-1 text-sm text-ink-soft">{level.brief}</p>
          <a
            href={level.lesson.href}
            className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-ink-soft underline"
          >
            <BookOpen className="h-3 w-3" aria-hidden />
            {copy.labels.reviewLesson}
          </a>
        </div>

        <div className="relative rounded-blob border-4 border-line bg-cream p-3 shadow-sticker">
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: level.height }).map((_, y) =>
              Array.from({ length: level.width }).map((__, x) => {
                const tile = tileAt(level, x, y);
                const hasDrone = drone.x === x && drone.y === y;
                return (
                  <div
                    key={`${x}-${y}`}
                    style={{ boxShadow: '0 4px 0 0 var(--color-line)' }}
                    className={cn(
                      'relative grid aspect-square place-items-center rounded-lg border-2 border-line transition-transform duration-150 hover:-translate-y-0.5',
                      tile?.crop === 'ripe' && 'bg-butter-soft',
                      tile?.crop === 'empty' && 'bg-paper',
                      tile?.crop === 'rock' && 'bg-ink/20',
                      !tile && 'bg-paper/70',
                    )}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-1 top-1 h-1/3 rounded-md bg-paper/50"
                    />
                    {tile?.crop === 'ripe' ? (
                      <Wheat className="relative h-5 w-5 text-ink" aria-hidden />
                    ) : null}
                    {tile?.crop === 'empty' ? (
                      <span className="h-2 w-2 rounded-full border-2 border-line/40" aria-hidden />
                    ) : null}
                    {tile?.crop === 'rock' ? <Mountain className="h-5 w-5 text-ink" aria-hidden /> : null}
                    {tile?.questionId && !answered.has(tile.questionId) ? (
                      <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-line bg-paper text-[0.5rem] font-bold">
                        ?
                      </span>
                    ) : null}
                    {tile?.questionId && answered.has(tile.questionId) ? (
                      <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full border-2 border-line bg-mint text-ink">
                        <Check className="h-2.5 w-2.5" aria-hidden />
                      </span>
                    ) : null}
                    {trail.has(`${x},${y}`) && !hasDrone ? (
                      <span className="absolute bottom-1 left-1 h-1.5 w-1.5 rounded-full bg-coral/70" aria-hidden />
                    ) : null}
                    {hasDrone ? (
                      <span className="absolute inset-1 z-10 grid place-items-center rounded-lg border-2 border-line bg-mint-soft shadow-sticker-sm">
                        <span
                          aria-hidden
                          className="absolute -top-1 h-3 w-6 animate-spin rounded-full border-2 border-line bg-paper/70 [animation-duration:1.2s]"
                        />
                        <ArrowUp
                          className="relative h-5 w-5 text-ink"
                          style={{ transform: `rotate(${drone.dir * 90}deg)` }}
                          aria-hidden
                        />
                      </span>
                    ) : null}
                  </div>
                );
              }),
            )}
          </div>

          {question ? (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-blob bg-ink/40 p-3 backdrop-blur-sm">
              <div className="max-h-full w-full max-w-md overflow-y-auto rounded-blob border-2 border-line bg-paper p-4 shadow-sticker">
                <div className="flex items-center justify-between gap-2">
                  <Badge tint="butter">{copy.labels.question}</Badge>
                  <span className="text-xs font-semibold text-ink-soft">{question.concept}</span>
                </div>
                <p className="mt-2 font-display font-bold">{question.prompt}</p>
                <div className="mt-2 flex flex-col gap-2">
                  {question.options.map((option, i) => {
                    const chosen = choice === i;
                    const correct = i === question.answerIndex;
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={choice !== null}
                        onClick={() => answer(i)}
                        className={cn(
                          'flex items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left text-sm transition-colors',
                          choice !== null && correct
                            ? 'border-mint-deep bg-mint-soft'
                            : chosen && !correct
                              ? 'border-coral-deep bg-coral-soft'
                              : 'border-line/30 bg-paper hover:border-line',
                        )}
                      >
                        <span>{option}</span>
                        {choice !== null && correct ? (
                          <Check className="h-4 w-4 shrink-0 text-mint-deep" aria-hidden />
                        ) : chosen && !correct ? (
                          <X className="h-4 w-4 shrink-0 text-coral-deep" aria-hidden />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
                {choice !== null ? (
                  <>
                    <p className="mt-2 text-xs text-ink-soft">{question.explanation}</p>
                    <p className={cn('mt-2 text-sm font-bold', wrong ? 'text-coral-deep' : 'text-mint-deep')}>
                      {wrong ? copy.labels.wrong : copy.labels.correct}
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      {wrong ? (
                        <Button variant="secondary" size="sm" onClick={retryAll}>
                          {copy.labels.retry}
                        </Button>
                      ) : (
                        <Button variant="mint" size="sm" onClick={resumeAfterCorrect}>
                          {copy.labels.close}
                        </Button>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {playing ? (
            <Button variant="secondary" size="sm" onClick={stop}>
              <Square className="h-4 w-4" /> {copy.labels.stop}
            </Button>
          ) : (
            <Button variant="mint" size="sm" onClick={start} disabled={!program.length}>
              <Play className="h-4 w-4" /> {copy.labels.run}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => resetLevel()}>
            <RotateCcw className="h-4 w-4" /> {copy.labels.reset}
          </Button>
          <span className="text-xs text-ink-soft">
            {copy.labels.steps}: {Math.min(cursor, frames.length ? frames.length - 1 : 0)}/{level.maxSteps}
          </span>
        </div>

        {finished ? (
          <div
            className={cn(
              'rounded-blob border-2 border-line px-4 py-3 shadow-sticker-sm',
              finished.done ? 'bg-mint-soft' : 'bg-coral-soft',
            )}
          >
            <p className="font-display font-bold">
              {finished.done ? copy.labels.success : finished.reason === 'steps' ? copy.labels.tooMany : copy.labels.tryAgain}
            </p>
            <p className="mt-1 text-sm">
              {copy.labels.mastered}: {mastered}/{level.questions.length}
              {weak.length ? ` · ${copy.labels.weak}: ${weak.join(', ')}` : ''}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={level.lesson.href}
                className="inline-flex items-center gap-1 rounded-pill border-2 border-line bg-paper px-3 py-1 text-xs font-semibold"
              >
                <BookOpen className="h-3 w-3" aria-hidden />
                {copy.labels.reviewLesson}
              </a>
              {finished.done && levelIndex < copy.levels.length - 1 ? (
                <Button size="sm" onClick={() => resetLevel(levelIndex + 1)}>
                  {copy.labels.next}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <aside className="flex flex-col gap-3">
        <div className="rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
          <p className="text-xs font-bold text-ink-soft uppercase">{copy.labels.commands}</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {level.allowed.map((command) => {
              const Icon = COMMAND_ICON[command];
              return (
                <button
                  key={command}
                  type="button"
                  onClick={() => addCommand(command)}
                  disabled={playing || program.length >= MAX_COMMANDS}
                  className="flex items-center gap-2 rounded-xl border-2 border-line bg-cream px-2 py-2 text-left text-sm font-semibold shadow-sticker-sm transition-transform hover:-translate-y-0.5 disabled:opacity-50"
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {copy.labels[command]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-blob border-2 border-line bg-paper p-3 shadow-sticker-sm">
          <p className="text-xs font-bold text-ink-soft uppercase">{copy.labels.program}</p>
          {program.length ? (
            <ol className="mt-2 flex flex-col gap-1">
              {program.map((command, i) => {
                const Icon = COMMAND_ICON[command];
                return (
                  <li
                    key={`${command}-${i}`}
                    className="flex items-center gap-2 rounded-lg border-2 border-line/30 bg-cream px-2 py-1 text-sm"
                  >
                    <span className="w-4 text-xs text-ink-soft">{i + 1}</span>
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="flex-1">{copy.labels[command]}</span>
                    <button
                      type="button"
                      onClick={() => removeAt(i)}
                      disabled={playing}
                      aria-label={copy.labels.reset}
                      className="text-ink-soft disabled:opacity-40"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">{copy.labels.empty}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2 border-t-2 border-line/20 pt-2">
            <span className="text-xs font-bold text-ink-soft uppercase">{copy.labels.loop}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLoop(n)}
                  disabled={playing}
                  className={cn(
                    'h-7 w-7 rounded-full border-2 border-line text-xs font-bold',
                    loop === n ? 'bg-butter' : 'bg-paper text-ink-soft',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-blob border-2 border-line/40 bg-cream px-3 py-2 text-xs text-ink-soft">
          <HelpCircle className="mr-1 inline h-3 w-3" aria-hidden />
          {copy.labels.hint}
        </div>
      </aside>
    </div>
  );
}
