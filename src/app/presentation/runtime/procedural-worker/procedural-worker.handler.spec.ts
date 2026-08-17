import {
  handleProceduralWorkerRequest,
  resetProceduralWorkerParticleSessionsForTests,
} from './procedural-worker.handler';

import {
  AnyProceduralWorkerRequest,
} from './procedural-worker.protocol';

describe(
  'ProceduralWorkerHandler',
  () => {
    beforeEach(() => {
      resetProceduralWorkerParticleSessionsForTests();
    });

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
      'should reject a window request when its worker particle session no longer exists',
      async () => {
        const request = {
          id:
            'request-window-missing',
          task:
            'galactic-map-particle-window',
          payload: {
            sessionId:
              'missing-session',
            window: {
              active: {
                minX:
                  0,
                maxX:
                  0,
                minY:
                  0,
                maxY:
                  0,
              },
              activeSectorCount:
                1,
              lodLevel:
                'DETAIL',
              signature:
                'DETAIL:0:0:0:0',
            },
          },
        } as unknown as
          AnyProceduralWorkerRequest;

        const response =
          await handleProceduralWorkerRequest(
            request,
            'worker',
          );

        expect(
          response.ok,
        ).toBe(
          false,
        );

        if (
          !response.ok
        ) {
          expect(
            response.error.message,
          ).toContain(
            'missing-session',
          );
        }
      },
    );

    it(
      'should release an absent particle session safely and idempotently',
      async () => {
        const response =
          await handleProceduralWorkerRequest(
            {
              id:
                'request-release',
              task:
                'galactic-map-particle-release',
              payload: {
                sessionId:
                  'already-absent',
              },
            },
            'worker',
          );

        expect(
          response,
        ).toEqual({
          id:
            'request-release',
          task:
            'galactic-map-particle-release',
          ok: true,
          result: {
            runtime:
              'worker',
            sessionId:
              'already-absent',
            released:
              false,
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
