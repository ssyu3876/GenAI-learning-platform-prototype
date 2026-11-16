import { describe, expect, it } from 'vitest';
import { buildMockReply, buildSystemPrompt, detectIntent, keyIdea, truncate, type TutorLessonContext } from './prompt';
import { lessonIdFromPath } from './shared';

const lesson: TutorLessonContext = {
  id: 'lsn_1',
  courseId: 'crs_1',
  title: 'What is version control?',
  courseTitle: 'Git basics',
  subject: 'Software Engineering',
  content: '# Version control\n\nVersion control keeps a history of every change so a team can work safely. More text.',
  gradedItems: ['Quiz question: What does git commit do?'],
};

describe('lessonIdFromPath', () => {
  it('reads the lesson id from lesson URLs only', () => {
    expect(lessonIdFromPath('/courses/git-basics/lessons/lsn_abc')).toBe('lsn_abc');
    expect(lessonIdFromPath('/courses/git-basics/lessons/lsn_abc/extra')).toBe('lsn_abc');
    expect(lessonIdFromPath('/courses/git-basics')).toBeNull();
    expect(lessonIdFromPath('/home')).toBeNull();
    expect(lessonIdFromPath(null)).toBeNull();
  });
});

describe('buildSystemPrompt', () => {
  it('includes the lesson, graded items and the learner background', () => {
    const prompt = buildSystemPrompt({
      lesson,
      profile: { background: 'non_cs', codingLevel: 0, track: 'explorer' },
      learnerName: 'Mia Wong',
    });
    expect(prompt).toContain('What is version control?');
    expect(prompt).toContain('What does git commit do?');
    expect(prompt).toContain('everyday analogies');
    expect(prompt).toContain('Mia');
    expect(prompt).toContain('150 words');
  });

  it('works without a lesson or profile', () => {
    const prompt = buildSystemPrompt({ lesson: null, profile: null, learnerName: 'Leo' });
    expect(prompt).toContain('not on a specific lesson');
    expect(prompt).toContain('unknown');
  });

  it('adds the reviewed question and permits a post-attempt explanation', () => {
    const prompt = buildSystemPrompt({
      lesson,
      profile: null,
      learnerName: 'Mia',
      review: {
        question: 'What does git commit do?',
        options: ['Save a snapshot', 'Delete the repo'],
        wrongAnswer: 'Delete the repo',
        correctAnswer: 'Save a snapshot',
        explanation: 'A commit records a snapshot in history.',
      },
    });
    expect(prompt).toContain('already answered incorrectly');
    expect(prompt).toContain('Save a snapshot');
    expect(prompt).toContain('Delete the repo');
    expect(prompt).toContain('post-attempt review');
  });
});

describe('mock replies', () => {
  it('mentions demo mode and the lesson title', () => {
    const reply = buildMockReply({ question: 'Explain this more simply', lesson });
    expect(reply).toContain('Demo mode');
    expect(reply).toContain('What is version control?');
  });

  it('picks an intent from the quick prompts', () => {
    expect(detectIntent('Explain this more simply')).toBe('simpler');
    expect(detectIntent('Give me a real-world example')).toBe('example');
    expect(detectIntent('Quiz me with one question')).toBe('quiz');
    expect(detectIntent('How is this used at work?')).toBe('work');
    expect(detectIntent('What is a branch?')).toBe('general');
  });

  it('works without a lesson', () => {
    expect(buildMockReply({ question: 'hi', lesson: null })).toContain('this topic');
  });
});

describe('keyIdea / truncate', () => {
  it('finds the first real sentence, skipping headings and code', () => {
    expect(keyIdea('# Title\n\n```js\nconst a = 1; // a long line of code here\n```\nTests catch bugs before users do. Then more.')).toBe(
      'Tests catch bugs before users do.',
    );
    expect(keyIdea('# Only a heading')).toBeNull();
  });

  it('truncates long text', () => {
    expect(truncate('abcdef', 3)).toMatch(/^abc\n\n\[…lesson continues\]$/);
    expect(truncate('abc', 3)).toBe('abc');
  });
});
