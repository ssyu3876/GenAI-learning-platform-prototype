'use client';

// AI-narrated slides: text-to-speech in the browser (no audio files, no API cost).
// Captions are always visible so it works muted and for deaf / hard-of-hearing learners.
import { ChevronLeft, ChevronRight, Pause, Play, Volume2 } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ActivityPlayerProps } from '@/core/activity-types';
import { Button, cn, Pip } from '@/components/ui';
import { useLocale, useT } from '@/i18n/client';
import { fmt } from '@/i18n/format';
import { ActivityFrame, ResultPanel } from '../components/activity-frame';
import { useCompletion } from '../components/use-completion';
import type { SlidesConfig } from './schema';

const noopSubscribe = () => () => {};

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const prefix = locale === 'zh' ? 'zh' : 'en';
  const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(prefix));
  const preferred = locale === 'zh' ? /natural|neural|ting|mei|xiaoxiao|google 普通话/i : /natural|neural|samantha|aria|jenny|google us/i;
  return voices.find((v) => preferred.test(v.name)) ?? voices[0];
}

export function SlidesPlayer({ activity, config, onComplete, previousBest, preview }: ActivityPlayerProps<SlidesConfig>) {
  const t = useT();
  const locale = useLocale();
  const [index, setIndex] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [seen, setSeen] = useState<Set<number>>(() => new Set([0]));
  const [finished, setFinished] = useState(false);
  const autoRef = useRef(autoplay);
  const { submit, submitting, outcome, error, reset } = useCompletion(onComplete);

  const slide = config.slides[index]!;
  const last = index === config.slides.length - 1;

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

  function go(to: number) {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setIndex(to);
    setSeen((s) => new Set(s).add(to));
  }

  function speak(i: number) {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(config.slides[i]!.narration);
    u.lang = locale === 'zh' ? 'zh-CN' : 'en-US';
    const voice = pickVoice(locale);
    if (voice) u.voice = voice;
    u.rate = 1.02;
    u.pitch = 1.1;
    u.onend = () => {
      setSpeaking(false);
      if (autoRef.current && i < config.slides.length - 1) {
        setTimeout(() => {
          go(i + 1);
          speak(i + 1);
        }, 500);
      }
    };
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }

  function togglePlay() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setAutoplay(false);
    } else {
      setAutoplay(true);
      speak(index);
    }
  }

  function finish() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
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
          {slide.bullets.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {slide.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-lg">
                  <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-line bg-butter" aria-hidden />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <Pip mood={speaking ? 'cheer' : 'happy'} size={56} className={cn(speaking && 'animate-wiggle')} />
          <div className="flex-1 rounded-xl border-2 border-line bg-butter-soft px-3 py-2 text-sm" aria-live="polite">
            <span className="mb-0.5 flex items-center gap-1 text-xs font-bold text-ink-soft">
              <Volume2 className="h-3 w-3" /> {t.activities.slides.captions}
            </span>
            {slide.narration}
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
