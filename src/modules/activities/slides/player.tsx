'use client';

// AI-narrated slides: text-to-speech in the browser (no audio files, no API cost).
// Captions are always visible so it works muted and for deaf / hard-of-hearing learners.
import { ChevronLeft, ChevronRight, Gauge, Pause, Play, Volume2 } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn, Pip } from '@/components/ui';
import { useLocale, useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { useCompletion } from '../components/use-completion';
import type { SlidesConfig } from './schema';
import { isSlideVisual, SlideVisual } from './visuals';
import { bulletForSentence, splitSentences } from './narration';

const noopSubscribe = () => () => {};

// Narration speed. 1× is a comfortable pace; most browser voices read slowly at their default
// rate, and Chinese voices more so, hence the per-language base rate.
const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
const BASE_RATE = { en: 1.1, zh: 1.2 } as const;
const PAUSE_BETWEEN_SLIDES_MS = 250;
// Chrome can drop an utterance queued in the same tick as cancel(); wait a moment first.
const RESTART_DELAY_MS = 60;
const SPEED_KEY = 'sprout.slides.speed';
const SPEED_EVENT = 'sprout:slides-speed';

// The learner's chosen speed, remembered in this browser. Falls back to memory when
// localStorage is unavailable (private mode, blocked storage).
let memorySpeed = 1;
function readSpeed(): number {
  try {
    const stored = Number(window.localStorage.getItem(SPEED_KEY));
    if ((SPEEDS as readonly number[]).includes(stored)) return stored;
  } catch {
    // storage blocked: use the in-memory value
  }
  return memorySpeed;
}
function writeSpeed(value: number) {
  memorySpeed = value;
  try {
    window.localStorage.setItem(SPEED_KEY, String(value));
  } catch {
    // storage blocked: memory only
  }
  window.dispatchEvent(new Event(SPEED_EVENT));
}
function subscribeSpeed(onChange: () => void) {
  window.addEventListener(SPEED_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SPEED_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const prefix = locale === 'zh' ? 'zh' : 'en';
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const preferred = locale === 'zh' ? /natural|neural|ting|mei|xiaoxiao|google 普通话/i : /natural|neural|samantha|aria|jenny|google us/i;
  return voices.find((v) => preferred.test(v.name)) ?? voices[0];
}

/** Renders the narration as one string, wrapping the sentence being spoken. */
function withHighlightedSentence(text: string, lines: string[], active: number | null): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  lines.forEach((line, i) => {
    const at = text.indexOf(line, cursor);
    const start = at >= 0 ? at : cursor;
    if (start > cursor) nodes.push(text.slice(cursor, start));
    nodes.push(
      active === i ? (
        <span key={i} className="rounded bg-butter px-0.5 font-semibold">
          {line}
        </span>
      ) : (
        <Fragment key={i}>{line}</Fragment>
      ),
    );
    cursor = start + line.length;
  });
  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

export function SlidesPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<SlidesConfig>) {
  const t = useT();
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const [finished, setFinished] = useState(false);
  const autoRef = useRef(autoplay);
  const speed = useSyncExternalStore(subscribeSpeed, readSpeed, () => 1);
  const speedRef = useRef(speed);
  // Each narration gets a number. Events from a narration that was stopped (cancel() fires
  // them late) are ignored, so they cannot flip the play button or skip a slide.
  const runRef = useRef(0);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const slide = config.slides[index]!;
  const last = index === config.slides.length - 1;
  const narrationLines = splitSentences(slide.narration);
  const activeBullet = speaking
    ? bulletForSentence(sentenceIndex, narrationLines.length, slide.bullets.length)
    : null;

  // Browser-only capability check without a hydration mismatch (false on the server)
  const canSpeak = useSyncExternalStore(
    noopSubscribe,
    () => 'speechSynthesis' in window,
    () => false,
  );

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    autoRef.current = autoplay;
  }, [autoplay]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  /** Stops any narration and makes every event it still fires stale. */
  function stopSpeech() {
    runRef.current += 1;
    window.speechSynthesis?.cancel();
  }

  function go(to: number) {
    stopSpeech();
    setSpeaking(false);
    setSentenceIndex(0);
    setIndex(to);
    setSeen((s) => new Set(s).add(to));
  }

  /**
   * Speaks the slide one sentence at a time, so the matching bullet and caption can light up.
   * Each sentence is its own utterance; onend queues the next one instead of relying on a
   * timing file.
   */
  function speak(i: number, rate = speedRef.current) {
    const synth = window.speechSynthesis;
    stopSpeech();
    const run = runRef.current;
    const lines = splitSentences(config.slides[i]!.narration);
    const voice = pickVoice(locale);
    setSpeaking(true);
    setSentenceIndex(0);

    const speakLine = (line: number) => {
      if (run !== runRef.current) return;
      if (line >= lines.length) {
        setSpeaking(false);
        if (autoRef.current && i < config.slides.length - 1) {
          setTimeout(() => {
            if (run !== runRef.current) return;
            go(i + 1);
            speak(i + 1);
          }, PAUSE_BETWEEN_SLIDES_MS);
        }
        return;
      }

      setSentenceIndex(line);
      const u = new SpeechSynthesisUtterance(lines[line]!);
      u.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
      if (voice) u.voice = voice;
      u.rate = (locale === 'zh' ? BASE_RATE.zh : BASE_RATE.en) * rate;
      u.pitch = 1.1;
      u.onend = () => {
        if (run !== runRef.current) return;
        speakLine(line + 1);
      };
      u.onerror = (e) => {
        if (run !== runRef.current || e.error === 'interrupted' || e.error === 'canceled') return;
        setSpeaking(false);
      };
      synth.speak(u);
    };

    setTimeout(() => {
      if (run !== runRef.current) return;
      synth.resume();
      speakLine(0);
    }, RESTART_DELAY_MS);
  }

  function togglePlay() {
    if (speaking) {
      stopSpeech();
      setSpeaking(false);
      setAutoplay(false);
    } else {
      setAutoplay(true);
      speak(index);
    }
  }

  function cycleSpeed() {
    const next = SPEEDS[(SPEEDS.indexOf(speedRef.current as (typeof SPEEDS)[number]) + 1) % SPEEDS.length]!;
    speedRef.current = next;
    writeSpeed(next);
    // Mid-sentence: restart this slide at the new speed so the change is heard at once
    if (speaking) speak(index, next);
  }

  function finish() {
    stopSpeech();
    setSpeaking(false);
    setSentenceIndex(0);
    setFinished(true);
    const score = Math.round((seen.size / config.slides.length) * 100);
    void submit({ score, detail: { seen: seen.size } });
  }

  if (finished) {
    const score = Math.round((seen.size / config.slides.length) * 100);
    return (
      <ActivityFrame kind={t.activities.frame.slides} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview}>
        <ResultPanel
          score={score}
          outcome={outcome}
          submitting={submitting}
          error={error}
          preview={preview}
          onRetry={() => {
            setFinished(false);
            setIndex(0);
            reset();
          }}
        />
      </ActivityFrame>
    );
  }

  return (
    <ActivityFrame kind={t.activities.frame.slides} title={activity.title} xpReward={activity.xpReward} previousBest={previousBest} preview={preview} tint="lilac">
      <div className="flex flex-col gap-4">
        <div className="relative min-h-64 rounded-blob border-2 border-line bg-paper p-6 shadow-sticker-sm sm:p-8">
          <div className="mb-1 text-xs font-bold text-ink-soft">
            {fmt(t.activities.slides.slideOf, { current: index + 1, total: config.slides.length })}
          </div>
          <h4 className="text-2xl font-bold sm:text-3xl">{slide.heading}</h4>
          {slide.visual && isSlideVisual(slide.visual) ? (
            <div className="mt-4">
              <SlideVisual name={slide.visual} />
            </div>
          ) : null}
          {slide.bullets.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {slide.bullets.map((b, i) => (
                <li
                  key={i}
                  className={cn(
                    'flex gap-2 rounded-xl px-1 text-lg transition-colors',
                    activeBullet === i && 'bg-butter-soft',
                  )}
                >
                  <span
                    className={cn(
                      'mt-2 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-line',
                      activeBullet === i ? 'bg-coral' : 'bg-butter',
                    )}
                    aria-hidden
                  />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <Pip mood={speaking ? 'cheer' : 'happy'} size={56} className={cn(speaking && 'animate-wiggle')} />
          <div
            className="flex-1 rounded-xl border-2 border-line bg-butter-soft px-3 py-2 text-sm"
            aria-live={speaking ? 'off' : 'polite'}
          >
            <span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-ink-soft">
              <Volume2 className="h-3 w-3" /> {t.activities.slides.captions}
            </span>
            {withHighlightedSentence(
              slide.narration,
              narrationLines,
              speaking ? sentenceIndex : null,
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t.activities.slides.previous}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {canSpeak ? (
            <Button variant="mint" size="sm" onClick={togglePlay}>
              {speaking ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {speaking ? t.activities.slides.pause : t.activities.slides.play}
            </Button>
          ) : (
            <span className="text-sm text-ink-soft">{t.activities.slides.noSpeech}</span>
          )}
          {canSpeak ? (
            <Button variant="secondary" size="sm" onClick={cycleSpeed} aria-label={fmt(t.activities.slides.speed, { speed })}>
              <Gauge className="h-4 w-4" aria-hidden />
              {speed}×
            </Button>
          ) : null}
          <Button variant="secondary" size="sm" onClick={() => go(index + 1)} disabled={last} aria-label={t.activities.slides.next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="mx-2 flex gap-1" aria-hidden>
            {config.slides.map((_, i) => (
              <span key={i} className={cn('h-2.5 w-2.5 rounded-full border-2 border-line', i === index ? 'bg-coral' : seen.has(i) ? 'bg-mint' : 'bg-paper')} />
            ))}
          </div>
          {last ? (
            <Button className="ml-auto" size="sm" onClick={finish}>
              {t.activities.slides.finish}
            </Button>
          ) : null}
        </div>
      </div>
    </ActivityFrame>
  );
}
