'use client';

import { useEffect, useState } from 'react';
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Mountain,
  Play,
  RotateCcw,
  Sprout,
  Square,
  Trash2,
  Wheat,
  X,
} from 'lucide-react';
import { Badge, Button, cn } from '@/components/ui';
import type { FarmCopy } from '../content/farm-lab';
import {
  runFarm,
  tileAt,
  type FarmCommand,
  type FarmFrame,
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
  const [frames, setFrames] = useState<FarmFrame[]>([]);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [run, setRun] = useState<FarmResult | null>(null);
  const [finished, setFinished] = useState<FarmResult | null>(null);

  const frame = frames[cursor];
  const drone = frame ?? { ...level.start, harvested: 0, planted: 0, note: '' };

  useEffect(() => {
    if (!playing) return;
    if (cursor >= frames.length - 1) {
      const timer = window.setTimeout(() => {
        setPlaying(false);
        setFinished(run);
      }, TICK_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setCursor((c) => c + 1), TICK_MS);
    return () => window.clearTimeout(timer);
  }, [playing, cursor, frames.length, run]);

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

  function resetLevel(nextIndex = levelIndex) {
    const next = copy.levels[nextIndex]!;
    setLevelIndex(nextIndex);
    setProgram([]);
    setLoop(next.suggestedLoop);
    setFrames([]);
    setCursor(0);
    setPlaying(false);
    setRun(null);
    setFinished(null);
  }

  function start() {
    if (!program.length) return;
    const result = runFarm(level, program, loop);
    setRun(result);
    setFinished(null);
    setFrames(result.frames.length ? result.frames : [{ ...level.start, harvested: 0, planted: 0, note: '' }]);
    setCursor(0);
    setPlaying(true);
  }

  function stop() {
    setPlaying(false);
    setFinished(run);
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
        </div>

        <div className="rounded-blob border-2 border-line bg-sky-soft p-3 shadow-sticker-sm">
          <p className="font-display font-bold">{level.name}</p>
          <p className="mt-1 text-sm text-ink-soft">{level.brief}</p>
        </div>

        <div
          className="grid gap-1.5 rounded-blob border-2 border-line bg-cream p-3 shadow-sticker-sm"
          style={{ gridTemplateColumns: `repeat(${level.width}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: level.height }).map((_, y) =>
            Array.from({ length: level.width }).map((__, x) => {
              const tile = tileAt(level, x, y);
              const hasDrone = drone.x === x && drone.y === y;
              return (
                <div
                  key={`${x}-${y}`}
                  className={cn(
                    'relative grid aspect-square place-items-center rounded-xl border-2 border-line/40',
                    tile?.crop === 'ripe' && 'bg-butter-soft',
                    tile?.crop === 'empty' && 'bg-paper',
                    tile?.crop === 'rock' && 'bg-ink/20',
                    !tile && 'bg-paper/60',
                  )}
                >
                  {tile?.crop === 'ripe' ? <Wheat className="h-5 w-5 text-ink" aria-hidden /> : null}
                  {tile?.crop === 'empty' ? (
                    <span className="h-2 w-2 rounded-full border-2 border-line/40" aria-hidden />
                  ) : null}
                  {tile?.crop === 'rock' ? <Mountain className="h-5 w-5 text-ink" aria-hidden /> : null}
                  {hasDrone ? (
                    <span className="absolute inset-1 grid place-items-center rounded-lg bg-mint-soft shadow-sticker-sm">
                      <ArrowUp
                        className="h-5 w-5 text-ink"
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
            {finished.done && levelIndex < copy.levels.length - 1 ? (
              <Button className="mt-2" size="sm" onClick={() => resetLevel(levelIndex + 1)}>
                {copy.labels.next}
              </Button>
            ) : null}
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
          <Trash2 className="mr-1 inline h-3 w-3" aria-hidden />
          {copy.labels.hint}
        </div>
      </aside>
    </div>
  );
}
