/// <reference lib="webworker" />

import {
  galacticMapWorkerParticleBatchTransferables,
  type GalacticMapWorkerParticleBatch,
} from './galactic-map-particle-worker-session';

import {
  handleProceduralWorkerRequest,
} from './procedural-worker.handler';

import type {
  AnyProceduralWorkerRequest,
  AnyProceduralWorkerResponse,
} from './procedural-worker.protocol';

addEventListener(
  'message',
  async (
    event: MessageEvent<
      AnyProceduralWorkerRequest
    >,
  ) => {
    const response =
      await handleProceduralWorkerRequest(
        event.data,
        'worker',
      );

    postMessage(
      response,
      responseTransferables(
        response,
      ),
    );
  },
);

function responseTransferables(
  response:
    AnyProceduralWorkerResponse,
): Transferable[] {

  if (
    !response.ok
  ) {
    return [];
  }

  if (
    response.task ===
      'galactic-map-particle-session' ||
    response.task ===
      'galactic-map-particle-window'
  ) {
    const result =
      response.result as {
        readonly batch:
          GalacticMapWorkerParticleBatch;
      };

    return galacticMapWorkerParticleBatchTransferables(
      result.batch,
    );
  }

  return [];
}

export {};
