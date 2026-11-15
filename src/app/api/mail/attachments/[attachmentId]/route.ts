// Authenticated download for a mail attachment.
import { requireUser } from '@/core/auth/session';
import { getMailAttachment } from '@/modules/mail/queries';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attachmentId: string }> },
) {
  const user = await requireUser();
  const { attachmentId } = await params;
  const attachment = await getMailAttachment(user, attachmentId);
  if (!attachment) return new Response('Not found', { status: 404 });
  const bytes = Buffer.from(attachment.data, 'base64');
  return new Response(bytes, {
    headers: {
      'Content-Type': attachment.mimeType,
      'Content-Length': String(bytes.byteLength),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(attachment.filename)}`,
      'Cache-Control': 'private, no-store',
    },
  });
}
