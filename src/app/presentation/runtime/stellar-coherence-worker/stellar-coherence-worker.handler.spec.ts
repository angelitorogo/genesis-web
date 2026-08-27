import {
  handleStellarCoherenceWorkerRequest,
} from './stellar-coherence-worker.handler';

import type {
  StellarCoherenceWorkerRequest,
} from './stellar-coherence-worker.protocol';

const REQUEST:
  StellarCoherenceWorkerRequest = {
    id:
      'stellar-coherence-worker-test-1',
    task:
      'stellar-coherence-batch',
    payload: {
      universeSeeds: [
        '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
      ],
      systemsPerSeed:
        64,
      maxRecordedViolations:
        8,
    },
  };

describe(
  'dedicated point-15.7 stellar coherence Worker handler',
  () => {
    it(
      'should execute a coherence batch without using the galactic particle Worker runtime',
      () => {
        const response =
          handleStellarCoherenceWorkerRequest(
            REQUEST,
          );

        expect(
          response.ok,
        ).toBe(
          true,
        );

        if (
          !response.ok
        ) {
          throw new Error(
            response.error.message,
          );
        }

        expect(
          response.id,
        ).toBe(
          REQUEST.id,
        );

        expect(
          response.report.complete,
        ).toBe(
          true,
        );

        expect(
          response.report.totalSystems,
        ).toBe(
          64,
        );

        expect(
          response.report.failedSystems,
        ).toBe(
          0,
        );
      },
    );

    it(
      'should return a structured-clone-safe response for a real Web Worker postMessage boundary',
      () => {
        const response =
          handleStellarCoherenceWorkerRequest(
            REQUEST,
          );

        const cloned =
          structuredClone(
            response,
          );

        expect(
          cloned,
        ).toEqual(
          response,
        );
      },
    );

    it(
      'should report invalid requests as Worker errors instead of throwing through the message boundary',
      () => {
        const response =
          handleStellarCoherenceWorkerRequest({
            ...REQUEST,
            id:
              'stellar-coherence-worker-test-error',
            payload: {
              universeSeeds: [],
              systemsPerSeed:
                1,
            },
          });

        expect(
          response.ok,
        ).toBe(
          false,
        );

        if (
          response.ok
        ) {
          throw new Error(
            'Expected a Worker error response.',
          );
        }

        expect(
          response.error.message,
        ).toMatch(
          /at least one UniverseSeed/i,
        );
      },
    );
  },
);
