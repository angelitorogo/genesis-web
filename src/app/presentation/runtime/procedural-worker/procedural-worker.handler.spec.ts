import {
  handleProceduralWorkerRequest,
} from './procedural-worker.handler';

import {
  AnyProceduralWorkerRequest,
} from './procedural-worker.protocol';

describe(
  'ProceduralWorkerHandler',
  () => {
    it(
      'should execute a worker health check',
      async () => {
        const response =
          await handleProceduralWorkerRequest(
            {
              id: 'request-1',
              task: 'health-check',
              payload: null,
            },
            'worker',
          );

        expect(
          response,
        ).toEqual({
          id: 'request-1',
          task: 'health-check',
          ok: true,
          result: {
            ready: true,
            runtime:
              'worker',
          },
        });
      },
    );

    it(
      'should support fallback execution',
      async () => {
        const response =
          await handleProceduralWorkerRequest(
            {
              id: 'request-2',
              task: 'health-check',
              payload: null,
            },
            'fallback',
          );

        expect(
          response,
        ).toEqual({
          id: 'request-2',
          task: 'health-check',
          ok: true,
          result: {
            ready: true,
            runtime:
              'fallback',
          },
        });
      },
    );

    it(
      'should reject an unsupported runtime task safely',
      async () => {
        const malformedRequest = {
          id: 'request-3',
          task: 'unknown-task',
          payload: null,
        } as unknown as
          AnyProceduralWorkerRequest;

        const response =
          await handleProceduralWorkerRequest(
            malformedRequest,
            'worker',
          );

        expect(
          response,
        ).toEqual({
          id: 'request-3',
          task: 'unknown-task',
          ok: false,
          error: {
            message:
              'Tarea procedural no soportada: unknown-task',
          },
        });
      },
    );
  },
);