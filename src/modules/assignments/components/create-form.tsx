'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Card, CardBody, Field, Input, Notice, Select, Textarea, buttonClasses } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import { createAssignment } from '../actions';
import type { TeacherClassOption, TeacherCourseOption } from '../queries';
import type { AssignmentType } from '../schema';

export function AssignmentCreateForm({
  classes,
  courses,
}: {
  classes: TeacherClassOption[];
  courses: TeacherCourseOption[];
}) {
  const t = useT();
  const [state, formAction] = useActionState(createAssignment, null);
  const [source, setSource] = useState<'manual' | 'ai'>('manual');
  const [type, setType] = useState<AssignmentType>('quiz');
  const [groupSize, setGroupSize] = useState(1);
  const [courseId, setCourseId] = useState(courses[0]?.id ?? '');
  const course = courses.find((item) => item.id === courseId);
  const quiz = type === 'quiz';

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="flex flex-col gap-5">
          {state && !state.ok ? <Notice tone="error">{state.error}</Notice> : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.assignments.create.class} htmlFor="assignment-class" hint={t.assignments.create.classHint}>
              <Select id="assignment-class" name="classId" required defaultValue={classes[0]?.id ?? ''}>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} · {cls.students}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.assignments.create.course} htmlFor="assignment-course" hint={t.assignments.create.courseHint}>
              <Select
                id="assignment-course"
                name="courseId"
                required
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                {courses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t.assignments.create.lesson} htmlFor="assignment-lesson" hint={t.assignments.create.lessonHint}>
              <Select id="assignment-lesson" name="lessonId" defaultValue="">
                <option value="">{t.assignments.create.noLesson}</option>
                {course?.lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.position + 1}. {lesson.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.assignments.create.week} htmlFor="assignment-week">
              <Input id="assignment-week" name="weekNo" type="number" min={1} max={24} defaultValue={1} required />
            </Field>
            <Field label={t.assignments.create.points} htmlFor="assignment-points">
              <Input id="assignment-points" name="points" type="number" min={1} max={1000} defaultValue={100} required />
            </Field>
            <Field label={t.assignments.create.weight} htmlFor="assignment-weight" hint={t.assignments.create.weightHint}>
              <Input id="assignment-weight" name="weight" type="number" min={0} max={1000} defaultValue={100} required />
            </Field>
            <Field label={t.assignments.create.groupSize} htmlFor="assignment-group" hint={t.assignments.create.groupSizeHint}>
              <Input
                id="assignment-group"
                name="groupSize"
                type="number"
                min={1}
                max={10}
                value={groupSize}
                onChange={(event) => setGroupSize(Number(event.target.value))}
                required
              />
            </Field>
            {groupSize === 1 ? (
              <Field label={t.assignments.create.peerReview} htmlFor="assignment-peer" hint={t.assignments.create.peerReviewHint}>
                <Input id="assignment-peer" name="peerReviewCount" type="number" min={0} max={5} defaultValue={0} required />
              </Field>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.assignments.create.type} htmlFor="assignment-type">
              <Select
                id="assignment-type"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value as AssignmentType)}
              >
                {(['quiz', 'project', 'assignment'] as const).map((value) => (
                  <option key={value} value={value}>
                    {t.assignments.type[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t.assignments.create.dueAt} htmlFor="assignment-due">
              <Input id="assignment-due" name="dueAt" type="datetime-local" required />
            </Field>
          </div>

          <Field label={t.assignments.create.source} htmlFor="assignment-source">
            <div className="flex flex-wrap gap-2">
              <label className={`cursor-pointer rounded-pill border-2 border-line px-3 py-2 text-sm font-semibold ${source === 'manual' ? 'bg-butter' : 'bg-paper'}`}>
                <input
                  type="radio"
                  name="source"
                  value="manual"
                  checked={source === 'manual'}
                  onChange={() => setSource('manual')}
                  className="sr-only"
                />
                {t.assignments.create.manual}
              </label>
              <label className={`cursor-pointer rounded-pill border-2 border-line px-3 py-2 text-sm font-semibold ${source === 'ai' ? 'bg-lilac' : 'bg-paper'}`}>
                <input
                  type="radio"
                  name="source"
                  value="ai"
                  checked={source === 'ai'}
                  onChange={() => setSource('ai')}
                  className="sr-only"
                />
                <Sparkles className="mr-1 inline h-4 w-4" aria-hidden />
                {t.assignments.create.ai}
              </label>
            </div>
          </Field>

          <Field label={t.assignments.create.titleField} htmlFor="assignment-title" hint={t.assignments.create.titleHint}>
            <Input id="assignment-title" name="title" maxLength={120} />
          </Field>
          <Field label={t.assignments.create.instructions} htmlFor="assignment-instructions">
            <Textarea
              id="assignment-instructions"
              name="instructions"
              rows={5}
              maxLength={20000}
              placeholder={t.assignments.create.instructionsPlaceholder}
            />
          </Field>

          {source === 'ai' ? (
            <Field label={t.assignments.create.aiPrompt} htmlFor="assignment-ai">
              <Textarea
                id="assignment-ai"
                name="aiPrompt"
                rows={4}
                maxLength={3000}
                placeholder={t.assignments.create.aiPromptPlaceholder}
              />
            </Field>
          ) : (
            <Field
              label={quiz ? t.assignments.create.quizFile : t.assignments.create.file}
              htmlFor="assignment-file"
              hint={quiz ? t.assignments.create.quizFileHint : t.assignments.create.fileHint}
            >
              <Input
                id="assignment-file"
                name="file"
                type="file"
                accept={quiz ? '.docx' : undefined}
                required={quiz}
                className="h-auto py-2"
              />
            </Field>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pendingText={t.assignments.create.submitting}>{t.assignments.create.submit}</SubmitButton>
            <Link href="/assignments" className={buttonClasses('ghost', 'sm')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> {t.assignments.create.cancel}
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
