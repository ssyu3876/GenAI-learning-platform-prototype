import { requireUser } from '@/core/auth/session';
import { CourseView } from '@/modules/courses/components/course-view';

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const user = await requireUser();
  const [{ slug }, { from }] = await Promise.all([params, searchParams]);
  return <CourseView user={user} slug={slug} from={from} />;
}
