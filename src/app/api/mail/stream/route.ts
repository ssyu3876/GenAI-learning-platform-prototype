// Server-sent unread count for the shell mailbox bell.
import { requireUser } from '@/core/auth/session';
import { unreadMailCount } from '@/modules/mail/queries';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const user = await requireUser();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      let running = false;
      const timerRef: { value?: ReturnType<typeof setInterval> } = {};

      const cleanup = () => {
        if (closed) return;
        closed = true;
        if (timerRef.value) clearInterval(timerRef.value);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const push = async () => {
        if (closed || running) return;
        running = true;
        try {
          const count = await unreadMailCount(user.id);
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ count })}\n\n`));
          } catch {
            cleanup();
          }
        } catch {
          cleanup();
        } finally {
          running = false;
        }
      };

      void push();
      timerRef.value = setInterval(push, 5_000);
      request.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
