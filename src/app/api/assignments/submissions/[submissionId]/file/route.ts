import { requireUser } from '@/core/auth/session';
import { getSubmissionFile } from '@/modules/assignments/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const user = await requireUser();
  const { submissionId } = await params;
  const file = await getSubmissionFile(user, submissionId);
  if (!file) return new Response('Not found', { status: 404 });
  const bytes = Buffer.from(file.data, 'base64');
  return new Response(bytes, {
    headers: {
      'Content-Type': file.mimeType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
