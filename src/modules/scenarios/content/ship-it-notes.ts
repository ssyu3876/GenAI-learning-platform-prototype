// Why a particular diff line matters, keyed by turn id and 0-based line index. Kept beside
// the turn bank instead of inside each turn object, because a note is written per line and
// would bury the scenario prose. `ship-it.ts` merges these into `ShipTurn.risks`.
//
// Not every line gets a note: the decisive line does, the surrounding context does not. A
// turn where the change is correct also gets one, so clicking does not teach suspicion.
export const SHIP_LINE_NOTES: Record<string, Record<number, string>> = {
  // ---- correct as written ----
  'guard-input': {
    3: 'The length check returns before create_user runs, so the eight-character rule cannot be skipped on the happy path.',
  },
  'const-time': {
    1: 'compare_digest walks both strings in constant time, so the response cannot reveal how much of a token matched.',
  },
  'add-index': {
    0: 'CONCURRENTLY is the part people forget: without it the index build takes a write lock on a table that is still taking orders.',
  },
  'paginate-cap': {
    0: 'The ceiling is applied before the query, so limit=99999 cannot ask for the whole table.',
    1: 'The floor matters too: a negative offset would otherwise be a database error or an undefined page.',
  },
  idempotency: {
    5: 'The charge happens once and the result is stored under the key, so a retry returns that result instead of billing again.',
  },
  'request-timeout': {
    0: 'Two timeouts, one for connect and one for read. Setting only one leaves the other phase unbounded.',
  },
  'null-guard': {
    1: 'The guard runs before max(), which is exactly where an empty cart used to raise.',
  },
  'redact-logs': {
    2: 'Masking by key name catches password, token and authorization whatever the value looks like.',
  },
  'feature-flag': {
    0: 'Default off, one call site, old path still there: the blast radius is zero until someone enables it.',
  },
  'failing-test-first': {
    4: 'quantize pins the exact cent. The line it replaced rounded to a whole unit, which is how the drift shipped.',
  },

  // ---- to reject ----
  expiry: {
    2: 'active is a flag, not a date. Nothing compares expires_at, so a coupon that expired last year still discounts.',
  },
  stacking: {
    1: 'A second discount nobody asked for. The brief allows one coupon per cart, and this quietly adds another.',
  },
  rounding: {
    1: 'The second argument is the precision. It changed from 2 to 0, so every total now rounds to a whole unit.',
  },
  swallow: {
    4: 'A failed charge returns True. The caller treats that as paid, the card is never billed, and the order still ships.',
  },
  'deleted-test': {
    0: 'The test was red because the expiry bug is still there. Deleting it removes the only signal; it does not fix the cause.',
  },
  'sql-concat': {
    0: 'The name is pasted into the SQL string. A value like " OR 1=1 -- turns a name lookup into a full table dump.',
  },
  'md5-password': {
    1: 'MD5 is fast by design and unsalted here. Both are exactly what a password hash must not be.',
  },
  'log-password': {
    1: 'The plaintext password, including typos of real passwords, is now in a log line that gets copied and retained.',
  },
  'verify-false': {
    1: 'verify=False turns certificate checking off. The error disappears, and so does any protection against a machine in the middle.',
  },
  'retry-forever': {
    4: 'continue with no cap, no backoff and no sleep: a failing gateway gets hammered until the worker is killed.',
  },

  // ---- to repair ----
  percentage: {
    1: 'A fraction is being subtracted as an amount. A 10% coupon takes 1000 off a 100 cart instead of 10%.',
  },
  'remove-coupon': {
    2: 'Copying subtotal over total deletes shipping and tax. The total has to be recomputed, not reset.',
  },
  concurrency: {
    1: 'Both requests can read before either writes, so both pass. A read is not a lock; this needs SELECT ... FOR UPDATE.',
  },
  'n-plus-one': {
    2: 'One query per order inside the loop. A hundred orders is 101 round trips; a join is one.',
  },
  'off-by-one': {
    0: 'Page 1 produces offset 25, so the first page is never shown. The offset is (page - 1) * limit.',
  },
  'float-money': {
    2: 'Only the accumulator became Decimal. The operands are still floats, so the drift is still there.',
  },
  'missing-return': {
    3: 'A bare return is None. The caller iterates the result, so the empty case still crashes, which is the case this was meant to fix.',
  },
  'naive-time': {
    0: 'datetime.now() is naive and server-local. The same row means a different instant after a region move.',
  },
  'unbounded-scan': {
    0: 'fetchall() holds the whole table in memory. Nothing in this diff streams, whatever the claim says.',
  },
  'mutable-default': {
    0: 'The list is created once, when the function is defined, and shared by every call after it.',
  },
};
