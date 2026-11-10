// Pip, the Sprout mascot: an original bean-shaped seedling that grows leaves as the
// learner levels up (stage 0 = seed ... 4 = little tree). Pure SVG, no assets.
import { cn } from './cn';

export type PipMood = 'happy' | 'cheer' | 'think' | 'sleepy' | 'wow';
export type PipStage = 0 | 1 | 2 | 3 | 4;

const BODY = ['#7FD8BE', '#7FD8BE', '#6FCFB3', '#5FC4A6', '#4FB896'];

function Mouth({ mood }: { mood: PipMood }) {
  switch (mood) {
    case 'cheer':
      return <path d="M43 66 Q50 76 57 66 Z" fill="#2B2240" />;
    case 'think':
      return <path d="M45 68 L55 67" stroke="#2B2240" strokeWidth="3" strokeLinecap="round" />;
    case 'sleepy':
      return <ellipse cx="50" cy="68" rx="3" ry="2" fill="#2B2240" />;
    case 'wow':
      return <ellipse cx="50" cy="68" rx="4" ry="5" fill="#2B2240" />;
    default:
      return (
        <path d="M44 66 Q50 72 56 66" stroke="#2B2240" strokeWidth="3" fill="none" strokeLinecap="round" />
      );
  }
}

function Eyes({ mood }: { mood: PipMood }) {
  if (mood === 'sleepy') {
    return (
      <g stroke="#2B2240" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M36 56 Q40 59 44 56" />
        <path d="M56 56 Q60 59 64 56" />
      </g>
    );
  }
  if (mood === 'cheer') {
    return (
      <g stroke="#2B2240" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M36 57 Q40 52 44 57" />
        <path d="M56 57 Q60 52 64 57" />
      </g>
    );
  }
  const dy = mood === 'think' ? -2 : 0;
  return (
    <g fill="#2B2240">
      <circle cx="40" cy={56 + dy} r={mood === 'wow' ? 4.5 : 4} />
      <circle cx="60" cy={56 + dy} r={mood === 'wow' ? 4.5 : 4} />
      <circle cx="41.5" cy={54.5 + dy} r="1.3" fill="#fff" />
      <circle cx="61.5" cy={54.5 + dy} r="1.3" fill="#fff" />
    </g>
  );
}

function Leaves({ stage }: { stage: PipStage }) {
  const leaf = (d: string, key: string) => (
    <path key={key} d={d} fill="#A6E86B" stroke="#2B2240" strokeWidth="2.5" strokeLinejoin="round" />
  );
  if (stage === 0) {
    // tiny seed tip
    return <path d="M50 24 Q53 18 50 13 Q47 18 50 24 Z" fill="#C79A5B" stroke="#2B2240" strokeWidth="2.5" />;
  }
  const stem = <path key="stem" d="M50 26 L50 14" stroke="#2B2240" strokeWidth="3" strokeLinecap="round" />;
  const items = [stem];
  items.push(leaf('M50 16 Q38 4 30 12 Q38 22 50 16 Z', 'l1'));
  if (stage >= 2) items.push(leaf('M50 16 Q62 4 70 12 Q62 22 50 16 Z', 'l2'));
  if (stage >= 3) items.push(leaf('M50 12 Q46 0 50 -6 Q54 0 50 12 Z', 'l3'));
  if (stage >= 4) {
    items.push(<circle key="f" cx="50" cy="-6" r="4.5" fill="#FFD166" stroke="#2B2240" strokeWidth="2.5" />);
  }
  return <g>{items}</g>;
}

export function Pip({
  mood = 'happy',
  stage = 2,
  size = 96,
  className,
  float,
  title = 'Pip',
}: {
  mood?: PipMood;
  stage?: PipStage;
  size?: number;
  className?: string;
  /** gentle idle bobbing */
  float?: boolean;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 -12 100 112"
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={cn('shrink-0 overflow-visible', float && 'animate-float', className)}
    >
      <Leaves stage={stage} />
      {/* body */}
      <path
        d="M50 24 C74 24 84 44 84 64 C84 84 70 96 50 96 C30 96 16 84 16 64 C16 44 26 24 50 24 Z"
        fill={BODY[stage]}
        stroke="#2B2240"
        strokeWidth="3"
      />
      {/* belly highlight */}
      <ellipse cx="50" cy="78" rx="20" ry="12" fill="#fff" opacity="0.35" />
      <Eyes mood={mood} />
      {/* blush */}
      <ellipse cx="31" cy="65" rx="5" ry="3" fill="#FF8A7A" opacity="0.7" />
      <ellipse cx="69" cy="65" rx="5" ry="3" fill="#FF8A7A" opacity="0.7" />
      <Mouth mood={mood} />
      {/* feet */}
      <ellipse cx="38" cy="97" rx="7" ry="3.5" fill="#2B2240" />
      <ellipse cx="62" cy="97" rx="7" ry="3.5" fill="#2B2240" />
    </svg>
  );
}

/** Speech bubble next to Pip, used for greetings, hints and feedback. */
export function PipSays({
  children,
  mood,
  stage,
  size = 72,
  className,
}: {
  children: React.ReactNode;
  mood?: PipMood;
  stage?: PipStage;
  size?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex items-end gap-3', className)}>
      <Pip mood={mood} stage={stage} size={size} />
      <div className="relative mb-3 rounded-blob border-2 border-line bg-paper px-4 py-3 shadow-sticker-sm">
        <span
          aria-hidden
          className="absolute -left-[9px] bottom-4 h-4 w-4 rotate-45 border-b-2 border-l-2 border-line bg-paper"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
