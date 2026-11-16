'use client';

import { useActionState, useEffect } from 'react';
import { Bookmark, Heart, Send, Share2, Star } from 'lucide-react';
import { Badge, Card, CardBody, Field, Notice, Select, Textarea } from '@/components/ui';
import { SubmitButton } from '@/components/ui/submit-button';
import { useT } from '@/i18n/client';
import type { CourseSocial } from '../library';
import {
  publishCourseToLibrary,
  recordCourseView,
  shareCourse,
  submitCourseReview,
  toggleCourseFavorite,
  toggleCourseLike,
} from '../actions';

export function CourseEngagement({
  courseId,
  social,
  isPublic,
  isOwner,
}: {
  courseId: string;
  social: CourseSocial;
  isPublic: boolean;
  isOwner: boolean;
}) {
  const t = useT();
  const [shareState, shareAction] = useActionState(shareCourse, null);
  const [reviewState, reviewAction] = useActionState(submitCourseReview, null);

  useEffect(() => {
    if (isPublic) void recordCourseView(courseId);
  }, [courseId, isPublic]);

  if (!isPublic) {
    return isOwner ? (
      <Card tint="butter">
        <CardBody className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold">{t.courses.library.publishTitle}</h2>
            <p className="text-sm text-ink-soft">{t.courses.library.publishHint}</p>
          </div>
          <form action={publishCourseToLibrary}>
            <input type="hidden" name="courseId" value={courseId} />
            <SubmitButton>{t.courses.library.publish}</SubmitButton>
          </form>
        </CardBody>
      </Card>
    ) : null;
  }

  return (
    <Card>
      <CardBody className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tint="butter">
            <Star className="h-3.5 w-3.5" /> {social.stats.rating.toFixed(1)} ({social.stats.reviews})
          </Badge>
          <Badge tint="paper">{social.stats.views} {t.courses.library.views.replace('{count}', '').trim()}</Badge>
          <form action={toggleCourseLike} className="ml-auto">
            <input type="hidden" name="courseId" value={courseId} />
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-pill border-2 border-line bg-paper px-3 py-1.5 text-sm font-semibold">
              <Heart className={social.liked ? 'h-4 w-4 fill-coral text-coral' : 'h-4 w-4'} />
              {social.liked ? t.courses.library.liked : t.courses.library.like} · {social.stats.likes}
            </button>
          </form>
          <form action={toggleCourseFavorite}>
            <input type="hidden" name="courseId" value={courseId} />
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-pill border-2 border-line bg-paper px-3 py-1.5 text-sm font-semibold">
              <Bookmark className={social.saved ? 'h-4 w-4 fill-butter text-ink' : 'h-4 w-4'} />
              {social.saved ? t.courses.library.saved : t.courses.library.save} · {social.stats.favorites}
            </button>
          </form>
          <Badge tint="paper">
            <Share2 className="h-3.5 w-3.5" /> {social.stats.shares}
          </Badge>
        </div>

        <details>
          <summary className="cursor-pointer text-sm font-bold">
            <Share2 className="mr-1 inline h-4 w-4" aria-hidden /> {t.courses.library.shareTitle}
          </summary>
          <form action={shareAction} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="courseId" value={courseId} />
            <label className="min-w-52 flex-1 text-sm font-semibold">
              {t.courses.library.shareChoose}
              <Select name="recipientId" required className="mt-1">
                <option value="">—</option>
                {social.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </Select>
            </label>
            <SubmitButton size="sm">
              <Send className="h-4 w-4" /> {t.courses.library.shareSubmit}
            </SubmitButton>
          </form>
          <p className="mt-2 text-xs text-ink-soft">{t.courses.library.shareHint}</p>
          {shareState && !shareState.ok ? <Notice tone="error">{shareState.error}</Notice> : null}
          {shareState?.ok ? <Notice tone="success">{shareState.message}</Notice> : null}
        </details>

        {social.reviews.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-bold">{t.courses.library.reviewsTitle}</h2>
            <ul className="mt-2 flex flex-col gap-2">
              {social.reviews.map((review) => (
                <li key={`${review.userId}-${review.createdAt.toString()}`} className="rounded-xl bg-paper p-3 text-sm">
                  <p className="font-semibold">
                    {review.userName} · {'★'.repeat(review.rating)}
                    <span className="text-ink-soft">{'☆'.repeat(5 - review.rating)}</span>
                  </p>
                  {review.body ? <p className="mt-1 whitespace-pre-wrap text-ink-soft">{review.body}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {social.canReview ? (
          <section>
            <h2 className="font-display text-lg font-bold">{t.courses.library.reviewsTitle}</h2>
            <p className="text-sm text-ink-soft">{t.courses.library.reviewsSubtitle}</p>
            <form action={reviewAction} className="mt-3 flex flex-col gap-3">
              <input type="hidden" name="courseId" value={courseId} />
              <div className="flex flex-wrap gap-3">
                <Field label={t.courses.library.reviewRating} htmlFor="library-review-rating">
                  <Select
                    id="library-review-rating"
                    name="rating"
                    required
                    defaultValue={social.ownReview?.rating ?? 5}
                    className="w-32"
                  >
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {'★'.repeat(rating)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t.courses.library.reviewBody} htmlFor="library-review-body" className="min-w-52 flex-1">
                  <Textarea
                    id="library-review-body"
                    name="body"
                    rows={3}
                    maxLength={800}
                    defaultValue={social.ownReview?.body ?? ''}
                  />
                </Field>
              </div>
              <div>
                <SubmitButton size="sm">{t.courses.library.reviewSubmit}</SubmitButton>
              </div>
            </form>
            {reviewState && !reviewState.ok ? <Notice tone="error">{reviewState.error}</Notice> : null}
            {reviewState?.ok ? <Notice tone="success">{reviewState.message}</Notice> : null}
          </section>
        ) : (
          <p className="text-sm text-ink-soft">{t.courses.library.reviewNeedsLesson}</p>
        )}
      </CardBody>
    </Card>
  );
}
