// Vercel Cron entry point. Local/dev calls are allowed; production requires Vercel's cron
// header (or an explicit CRON_SECRET bearer token if configured).
import { sendScheduledAssignmentReminders } from '@/modules/assignments/reminders';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  const isCron = request.headers.get('x-vercel-cron') === '1';
  const secret = process.env.CRON_SECRET;
  const authorized = secret ? request.headers.get('authorization') === `Bearer ${secret}` : isCron;
  if (process.env.NODE_ENV === 'production' && !authorized) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const result = await sendScheduledAssignmentReminders();
  return Response.json(result);
}
