/// <reference lib="webworker" />

import {
  handleProceduralWorkerRequest,
} from './procedural-worker.handler';

import type {
  AnyProceduralWorkerRequest,
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

    postMessage(response);
  },
);

export {};