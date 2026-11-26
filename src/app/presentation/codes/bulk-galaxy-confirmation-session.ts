/** BULKCONF-ARCHPERF.1 — keep the automatic Archive worker off incomplete
 * QA materializations. The Web Lock is shared with all archive workers/tabs.
 * Without Web Locks, the same-tab guard still avoids competing reindexing.
 */
let activeSessions = 0;

export function isBulkGalaxyConfirmationActive(): boolean {
  return activeSessions > 0;
}

export async function withBulkGalaxyConfirmationSession<T>(
  operation: () => Promise<T>,
): Promise<T> {
  activeSessions += 1;
  try {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return await navigator.locks.request('genesis-archive-38bis-b6', operation);
    }
    return await operation();
  } finally {
    activeSessions -= 1;
  }
}
