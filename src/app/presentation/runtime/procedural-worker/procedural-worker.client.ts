import {
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
} from '@angular/core';

import {
  handleProceduralWorkerRequest,
} from './procedural-worker.handler';

import {
  AnyProceduralWorkerRequest,
  AnyProceduralWorkerResponse,
  ProceduralWorkerPayload,
  ProceduralWorkerResult,
  ProceduralWorkerTaskName,
} from './procedural-worker.protocol';

export interface ProceduralWorkerPort {
  postMessage(
    message: AnyProceduralWorkerRequest,
  ): void;

  setMessageHandler(
    handler: (
      message: AnyProceduralWorkerResponse,
    ) => void,
  ): void;

  setErrorHandler(
    handler: (
      message: string,
    ) => void,
  ): void;

  terminate(): void;
}

export type ProceduralWorkerFactory =
  () => ProceduralWorkerPort;

class BrowserProceduralWorkerPort
  implements ProceduralWorkerPort {

  private readonly worker =
    new Worker(
      new URL(
        './procedural.worker',
        import.meta.url,
      ),
      {
        name:
          'genesis-procedural-worker',
      },
    );

  postMessage(
    message: AnyProceduralWorkerRequest,
  ): void {
    this.worker.postMessage(message);
  }

  setMessageHandler(
    handler: (
      message: AnyProceduralWorkerResponse,
    ) => void,
  ): void {
    this.worker.onmessage = (
      event: MessageEvent<
        AnyProceduralWorkerResponse
      >,
    ) => {
      handler(event.data);
    };
  }

  setErrorHandler(
    handler: (
      message: string,
    ) => void,
  ): void {
    this.worker.onerror = (
      event: ErrorEvent,
    ) => {
      handler(
        event.message ||
          'Error no identificado en el Web Worker.',
      );
    };
  }

  terminate(): void {
    this.worker.terminate();
  }
}

class InlineProceduralWorkerPort
  implements ProceduralWorkerPort {

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

  private terminated =
    false;

  postMessage(
    message: AnyProceduralWorkerRequest,
  ): void {
    if (this.terminated) {
      return;
    }

    queueMicrotask(() => {
      void this.execute(message);
    });
  }

  setMessageHandler(
    handler: (
      message: AnyProceduralWorkerResponse,
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

    this.messageHandler =
      null;

    this.errorHandler =
      null;
  }

  private async execute(
    message: AnyProceduralWorkerRequest,
  ): Promise<void> {
    try {
      const response =
        await handleProceduralWorkerRequest(
          message,
          'fallback',
        );

      if (
        !this.terminated
      ) {
        this.messageHandler?.(
          response,
        );
      }
    } catch (error: unknown) {
      if (
        !this.terminated
      ) {
        this.errorHandler?.(
          error instanceof Error
            ? error.message
            : String(error),
        );
      }
    }
  }
}

export function createProceduralWorkerPort():
  ProceduralWorkerPort {

  if (
    typeof Worker ===
    'undefined'
  ) {
    return new InlineProceduralWorkerPort();
  }

  return new BrowserProceduralWorkerPort();
}

export const PROCEDURAL_WORKER_FACTORY =
  new InjectionToken<
    ProceduralWorkerFactory
  >(
    'PROCEDURAL_WORKER_FACTORY',
    {
      providedIn: 'root',

      factory: () =>
        createProceduralWorkerPort,
    },
  );

interface PendingRequest {
  readonly resolve:
    (value: unknown) => void;

  readonly reject:
    (reason?: unknown) => void;
}

@Injectable({
  providedIn: 'root',
})
export class ProceduralWorkerClient {
  private readonly workerFactory =
    inject(
      PROCEDURAL_WORKER_FACTORY,
    );

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly pending =
    new Map<
      string,
      PendingRequest
    >();

  private worker:
    ProceduralWorkerPort
    | null = null;

  private requestSequence =
    0;

  constructor() {
    this.destroyRef.onDestroy(
      () => {
        this.dispose();
      },
    );
  }

  healthCheck(): Promise<
    ProceduralWorkerResult<
      'health-check'
    >
  > {
    return this.execute(
      'health-check',
      null,
    );
  }

  execute<
    TTask extends
      ProceduralWorkerTaskName,
  >(
    task: TTask,
    payload:
      ProceduralWorkerPayload<TTask>,
  ): Promise<
    ProceduralWorkerResult<TTask>
  > {
    const worker =
      this.getWorker();

    const id =
      `genesis-worker-${++this.requestSequence}`;

    const request = {
      id,
      task,
      payload,
    } as AnyProceduralWorkerRequest;

    return new Promise<
      ProceduralWorkerResult<TTask>
    >(
      (
        resolve,
        reject,
      ) => {
        this.pending.set(
          id,
          {
            resolve: (
              value: unknown,
            ) => {
              resolve(
                value as
                  ProceduralWorkerResult<TTask>,
              );
            },

            reject,
          },
        );

        try {
          worker.postMessage(
            request,
          );
        } catch (
          error: unknown
        ) {
          this.pending.delete(
            id,
          );

          reject(error);
        }
      },
    );
  }

  private getWorker():
    ProceduralWorkerPort {

    if (this.worker) {
      return this.worker;
    }

    const worker =
      this.workerFactory();

    worker.setMessageHandler(
      (
        response:
          AnyProceduralWorkerResponse,
      ) => {
        this.handleResponse(
          response,
        );
      },
    );

    worker.setErrorHandler(
      (
        message: string,
      ) => {
        this.handleWorkerFailure(
          message,
        );
      },
    );

    this.worker =
      worker;

    return worker;
  }

  private handleResponse(
    response:
      AnyProceduralWorkerResponse,
  ): void {
    const pending =
      this.pending.get(
        response.id,
      );

    if (!pending) {
      return;
    }

    this.pending.delete(
      response.id,
    );

    if (
      response.ok
    ) {
      pending.resolve(
        response.result,
      );

      return;
    }

    pending.reject(
      new Error(
        response.error.message,
      ),
    );
  }

  private handleWorkerFailure(
    message: string,
  ): void {
    const error =
      new Error(message);

    for (
      const request
      of this.pending.values()
    ) {
      request.reject(
        error,
      );
    }

    this.pending.clear();

    this.worker?.terminate();

    this.worker =
      null;
  }

  private dispose(): void {
    const error =
      new Error(
        'ProceduralWorkerClient destruido.',
      );

    for (
      const request
      of this.pending.values()
    ) {
      request.reject(
        error,
      );
    }

    this.pending.clear();

    this.worker?.terminate();

    this.worker =
      null;
  }
}