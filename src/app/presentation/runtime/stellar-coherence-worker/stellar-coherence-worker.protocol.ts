import type {
  StellarCoherenceBatchReport,
  StellarCoherenceBatchRequest,
} from '../../../simulation/stellar/stellar-coherence-batch-runner';

/**
 * Dedicated point-15.7 audit Worker protocol.
 *
 * This protocol is intentionally separate from procedural-worker.protocol.ts.
 * The galactic map Worker owns mutable particle sessions and must remain frozen;
 * stellar coherence batches have no reason to share that lifecycle or state.
 */
export interface StellarCoherenceWorkerRequest {
  readonly id:
    string;

  readonly task:
    'stellar-coherence-batch';

  readonly payload:
    StellarCoherenceBatchRequest;
}

export interface StellarCoherenceWorkerSuccessResponse {
  readonly id:
    string;

  readonly task:
    'stellar-coherence-batch';

  readonly ok:
    true;

  readonly report:
    StellarCoherenceBatchReport;
}

export interface StellarCoherenceWorkerErrorResponse {
  readonly id:
    string;

  readonly task:
    'stellar-coherence-batch';

  readonly ok:
    false;

  readonly error: {
    readonly message:
      string;
  };
}

export type StellarCoherenceWorkerResponse =
  | StellarCoherenceWorkerSuccessResponse
  | StellarCoherenceWorkerErrorResponse;
