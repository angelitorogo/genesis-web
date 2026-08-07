import {
  TestBed,
} from '@angular/core/testing';

import {
  PROCEDURAL_WORKER_FACTORY,
  ProceduralWorkerClient,
  ProceduralWorkerPort,
} from './procedural-worker.client';

import {
  AnyProceduralWorkerRequest,
  AnyProceduralWorkerResponse,
} from './procedural-worker.protocol';

class FakeProceduralWorkerPort
  implements ProceduralWorkerPort {

  readonly messages:
    AnyProceduralWorkerRequest[] =
      [];

  terminated =
    false;

  private messageHandler:
    | ((
        message:
          AnyProceduralWorkerResponse,
      ) => void)
    | null = null;

  private errorHandler:
    | ((
        message: string,
      ) => void)
    | null = null;

  postMessage(
    message: AnyProceduralWorkerRequest,
  ): void {
    this.messages.push(
      message,
    );
  }

  setMessageHandler(
    handler: (
      message:
        AnyProceduralWorkerResponse,
    ) => void,
  ): void {
    this.messageHandler =
      handler;
  }

  setErrorHandler(
    handler: (
      message: string,
    ) => void,
  ): void {
    this.errorHandler =
      handler;
  }

  terminate(): void {
    this.terminated =
      true;
  }

  respond(
    response:
      AnyProceduralWorkerResponse,
  ): void {
    this.messageHandler?.(
      response,
    );
  }

  fail(
    message: string,
  ): void {
    this.errorHandler?.(
      message,
    );
  }
}

describe(
  'ProceduralWorkerClient',
  () => {
    let fakeWorker:
      FakeProceduralWorkerPort;

    let createdWorkers:
      number;

    beforeEach(() => {
      fakeWorker =
        new FakeProceduralWorkerPort();

      createdWorkers =
        0;

      TestBed.configureTestingModule({
        providers: [
          ProceduralWorkerClient,

          {
            provide:
              PROCEDURAL_WORKER_FACTORY,

            useValue: () => {
              createdWorkers +=
                1;

              return fakeWorker;
            },
          },
        ],
      });
    });

    it(
      'should create the worker lazily',
      async () => {
        const client =
          TestBed.inject(
            ProceduralWorkerClient,
          );

        expect(
          createdWorkers,
        ).toBe(0);

        const resultPromise =
          client.healthCheck();

        expect(
          createdWorkers,
        ).toBe(1);

        const request =
          fakeWorker.messages[0];

        expect(
          request.task,
        ).toBe(
          'health-check',
        );

        fakeWorker.respond({
          id: request.id,
          task:
            'health-check',
          ok: true,
          result: {
            ready: true,
            runtime:
              'worker',
          },
        });

        await expect(
          resultPromise,
        ).resolves.toEqual({
          ready: true,
          runtime:
            'worker',
        });
      },
    );

    it(
      'should reuse one worker for multiple requests',
      async () => {
        const client =
          TestBed.inject(
            ProceduralWorkerClient,
          );

        const first =
          client.healthCheck();

        const second =
          client.healthCheck();

        expect(
          createdWorkers,
        ).toBe(1);

        const firstRequest =
          fakeWorker.messages[0];

        const secondRequest =
          fakeWorker.messages[1];

        fakeWorker.respond({
          id: secondRequest.id,
          task:
            'health-check',
          ok: true,
          result: {
            ready: true,
            runtime:
              'worker',
          },
        });

        fakeWorker.respond({
          id: firstRequest.id,
          task:
            'health-check',
          ok: true,
          result: {
            ready: true,
            runtime:
              'worker',
          },
        });

        await expect(
          first,
        ).resolves.toEqual({
          ready: true,
          runtime:
            'worker',
        });

        await expect(
          second,
        ).resolves.toEqual({
          ready: true,
          runtime:
            'worker',
        });
      },
    );

    it(
      'should reject a failed task response',
      async () => {
        const client =
          TestBed.inject(
            ProceduralWorkerClient,
          );

        const promise =
          client.healthCheck();

        const request =
          fakeWorker.messages[0];

        fakeWorker.respond({
          id: request.id,
          task:
            'health-check',
          ok: false,
          error: {
            message:
              'Fallo procedural.',
          },
        });

        await expect(
          promise,
        ).rejects.toThrow(
          'Fallo procedural.',
        );
      },
    );

    it(
      'should reject pending work when the worker fails',
      async () => {
        const client =
          TestBed.inject(
            ProceduralWorkerClient,
          );

        const first =
          client.healthCheck();

        const second =
          client.healthCheck();

        fakeWorker.fail(
          'Worker detenido.',
        );

        await expect(
          first,
        ).rejects.toThrow(
          'Worker detenido.',
        );

        await expect(
          second,
        ).rejects.toThrow(
          'Worker detenido.',
        );

        expect(
          fakeWorker.terminated,
        ).toBe(true);
      },
    );
  },
);