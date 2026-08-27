import {
  StellarCoherenceBatchRunner,
} from '../../../simulation/stellar/stellar-coherence-batch-runner';

import type {
  StellarCoherenceWorkerRequest,
  StellarCoherenceWorkerResponse,
} from './stellar-coherence-worker.protocol';

/**
 * Pure request handler shared by the dedicated Web Worker entry point and unit
 * tests. It does not touch the point-10.9 galactic particle Worker/session map.
 */
export function handleStellarCoherenceWorkerRequest(
  request:
    StellarCoherenceWorkerRequest,
): StellarCoherenceWorkerResponse {
  try {
    return {
      id:
        request.id,
      task:
        'stellar-coherence-batch',
      ok:
        true,
      report:
        StellarCoherenceBatchRunner
          .run(
            request.payload,
          ),
    };
  } catch (
    error: unknown
  ) {
    return {
      id:
        request.id,
      task:
        'stellar-coherence-batch',
      ok:
        false,
      error: {
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    };
  }
}
