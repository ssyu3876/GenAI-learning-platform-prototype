// Prefixed, URL-safe random ids, e.g. "crs_k3j9x2m1q8wz". The prefix tells you the table
// at a glance when reading logs or the database.
const ALPHABET = '0123456789abcdefghijkmnpqrstuvwxyz';

export const ID_PREFIX = {
  user: 'usr',
  course: 'crs',
  lesson: 'lsn',
  activity: 'act',
  attempt: 'att',
  event: 'evt',
  class: 'cls',
  aiUsage: 'aiu',
  audit: 'aud',
} as const;

export type IdKind = keyof typeof ID_PREFIX;

export function randomString(length: number, alphabet = ALPHABET): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function newId(kind: IdKind | (string & {})): string {
  const prefix = kind in ID_PREFIX ? ID_PREFIX[kind as IdKind] : kind;
  return `${prefix}_${randomString(12)}`;
}

/** Short human-friendly code (no 0/O/1/l), used for class invite codes. */
export function newInviteCode(): string {
  return randomString(6, 'ABCDEFGHJKMNPQRSTUVWXYZ23456789');
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/[\s_-]+/g, '-')
      .slice(0, 60) || 'course'
  );
}
