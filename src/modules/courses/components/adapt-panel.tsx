'use client';

// "Explain it my way": the same lesson, rewritten for the learner's background.
import { Baby, Briefcase, Cpu, X } from 'lucide-react';
import { useState } from 'react';
import { Button, cn, Markdown, Notice, Pip } from '@/components/ui';
import { useT } from '@/i18n/client';
import { adaptLesson } from '../actions';
import type { AdaptationVariant } from '../schema';

export function AdaptPanel({ lessonId, suggested }: { lessonId: string; suggested?: AdaptationVariant }) {
  const t = useT();
  const [active, setActive] = useState<AdaptationVariant | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const OPTIONS: { variant: AdaptationVariant; label: string; icon: typeof Baby }[] = [
    { variant: 'simpler', label: t.courses.adapt.simpler, icon: Baby },
    { variant: 'example', label: t.courses.adapt.example, icon: Briefcase },
    { variant: 'technical', label: t.courses.adapt.technical, icon: Cpu },
  ];

  async function load(variant: AdaptationVariant) {
    setActive(variant);
    setLoading(true);
    setError(null);
    try {
      const res = await adaptLesson(lessonId, variant);
      setContent(res.content);
    } catch {
      setError(t.courses.adapt.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-blob border-2 border-dashed border-line/50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-display font-semibold">{t.courses.adapt.prompt}</span>
        {OPTIONS.map(({ variant, label, icon: Icon }) => (
          <Button
            key={variant}
            size="sm"
            variant={active === variant ? 'butter' : 'secondary'}
            onClick={() => load(variant)}
            disabled={loading}
            className={cn(suggested === variant && active === null && 'ring-4 ring-butter')}
          >
            <Icon className="h-4 w-4" /> {label}
          </Button>
        ))}
      </div>
      {loading ? (
        <div className="mt-4 flex items-center gap-3">
          <Pip mood="think" size={44} className="animate-wiggle" />
          <span className="font-semibold">{t.courses.adapt.rewriting}</span>
        </div>
      ) : null}
      {error ? <Notice tone="error" className="mt-3">{error}</Notice> : null}
      {content && !loading ? (
        <div className="animate-pop relative mt-4 rounded-xl border-2 border-line bg-lilac-soft p-4">
          <button
            type="button"
            onClick={() => {
              setContent(null);
              setActive(null);
            }}
            className="absolute top-2 right-2 rounded-full p-1 hover:bg-paper"
            aria-label={t.courses.adapt.close}
          >
            <X className="h-4 w-4" />
          </button>
          <Markdown>{content}</Markdown>
        </div>
      ) : null}
    </div>
  );
}
