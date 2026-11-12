// Pairs rows already in the database with the items in a seed file, so syncing the preset
// courses keeps each row's id, and the learner progress attached to it, when content moves.
// Pure: no database access, so it can be unit-tested (match-rows.test.ts).

export interface SyncRow {
  id: string;
  position: number;
  title: string;
  /** Activities have a type; lessons do not. */
  type?: string;
}

export interface SyncItem {
  title: string;
  type?: string;
}

/**
 * Pairs each seed item with an existing row, by index into `items`:
 * 1. a row with the same title (and the same type, for activities): the item may have moved;
 * 2. otherwise the row at the item's position, if the type matches: the title was edited;
 * 3. otherwise null: a new item, which gets a new row and id.
 * Each row is used at most once. Rows left over (`unused`) were removed from the seed file.
 */
export function matchRows<R extends SyncRow>(
  rows: readonly R[],
  items: readonly SyncItem[],
): { matches: (R | null)[]; unused: R[] } {
  const free = new Set(rows.map((row) => row.id));
  const take = (row: R | undefined): R | null => {
    if (!row) return null;
    free.delete(row.id);
    return row;
  };
  const sameType = (row: R, item: SyncItem) => row.type === item.type;

  const matches = items.map((item) =>
    take(rows.find((row) => free.has(row.id) && sameType(row, item) && row.title === item.title)),
  );
  items.forEach((item, position) => {
    if (matches[position]) return;
    matches[position] = take(rows.find((row) => free.has(row.id) && sameType(row, item) && row.position === position));
  });
  return { matches, unused: rows.filter((row) => free.has(row.id)) };
}
