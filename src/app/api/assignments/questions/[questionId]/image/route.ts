import { requireUser } from '@/core/auth/session';
import { getQuestionImage } from '@/modules/assignments/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const user = await requireUser();
  const { questionId } = await params;
  const image = await getQuestionImage(user, questionId);
  if (!image) return new Response('Not found', { status: 404 });
  const bytes = Buffer.from(image.data, 'base64');
  return new Response(bytes, {
    headers: {
      'Content-Type': image.mimeType,
      'Content-Length': String(bytes.byteLength),
      'Cache-Control': 'private, no-store',
    },
  });
}
