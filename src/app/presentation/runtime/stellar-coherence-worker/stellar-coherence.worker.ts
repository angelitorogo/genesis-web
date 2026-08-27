/// <reference lib="webworker" />

import {
  handleStellarCoherenceWorkerRequest,
} from './stellar-coherence-worker.handler';

import type {
  StellarCoherenceWorkerRequest,
} from './stellar-coherence-worker.protocol';

/**
 * Dedicated point-15.7 Web Worker.
 *
 * It deliberately has no import path to procedural.worker.ts, its protocol,
 * client, particle session store or Three.js layout code. Large stellar audit
 * batches therefore cannot disturb galactic rendering state.
 */
addEventListener(
  'message',
  (
    event:
      MessageEvent<StellarCoherenceWorkerRequest>,
  ) => {
    postMessage(
      handleStellarCoherenceWorkerRequest(
        event.data,
      ),
    );
  },
);

export {};
