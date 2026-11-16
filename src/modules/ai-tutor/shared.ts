// Constants and helpers used by both the tutor panel (client) and the API handler (server).

/** Most recent messages sent to the model. Older ones are dropped. */
export const MAX_HISTORY = 12;
/** Max characters per message. */
export const MAX_MESSAGE_CHARS = 2000;

/** A review page opens the global tutor with this context. Kept as a DOM event contract
 * so the review module never imports the ai-tutor module. */
export const TUTOR_CONTEXT_EVENT = 'sprout:tutor-context';
export const TUTOR_RESUME_EVENT = 'sprout:tutor-resume';

export interface TutorResumePayload {
  sessionId: string;
  entry: 'review' | 'lesson' | 'general';
  courseId: string | null;
  courseTitle: string;
  lessonId: string | null;
  lessonTitle: string;
  reviewQuestion: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface TutorReviewHandoff {
  entry: 'review';
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  question: string;
  options: string[];
  wrongAnswerIndex: number | null;
  correctAnswerIndex: number;
  explanation: string;
}

export const QUICK_PROMPTS = [
  'Explain this more simply',
  'Give me a real-world example',
  'Quiz me with one question',
  'How is this used at work?',
] as const;

/** Lesson id from a lesson URL like /courses/<slug>/lessons/<lessonId>, else null. */
export function lessonIdFromPath(pathname: string | null | undefined): string | null {
  const match = pathname?.match(/^\/courses\/[^/]+\/lessons\/([^/?#]+)/);
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
