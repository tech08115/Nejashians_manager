// In-memory registry of poll IDs by type.
// For persistence across restarts, move this to the database.
export type PollType = 'SALAWAT' | 'BOOK';

const salawatPollIds = new Set<string>();
const bookPollIds = new Set<string>();

export function registerPoll(id: string | undefined, type: PollType) {
  if (!id) return; // defensive
  if (type === 'SALAWAT') salawatPollIds.add(id);
  else bookPollIds.add(id);
}

export function isSalawatPoll(id: string) {
  return salawatPollIds.has(id);
}

export function isBookPoll(id: string) {
  return bookPollIds.has(id);
}

// Optional pruning if needed for memory hygiene.
export function pruneOldPolls() {
  // no-op for now; implement timestamp tracking if required.
}
