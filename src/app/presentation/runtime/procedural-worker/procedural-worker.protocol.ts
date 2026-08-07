export type ProceduralWorkerRuntime =
  | 'worker'
  | 'fallback';

export interface ProceduralWorkerTaskMap {
  readonly 'health-check': {
    readonly payload: null;

    readonly result: {
      readonly ready: true;

      readonly runtime:
        ProceduralWorkerRuntime;
    };
  };
}

export type ProceduralWorkerTaskName =
  keyof ProceduralWorkerTaskMap;

export type ProceduralWorkerPayload<
  TTask extends ProceduralWorkerTaskName,
> =
  ProceduralWorkerTaskMap[TTask]['payload'];

export type ProceduralWorkerResult<
  TTask extends ProceduralWorkerTaskName,
> =
  ProceduralWorkerTaskMap[TTask]['result'];

export interface ProceduralWorkerRequest<
  TTask extends ProceduralWorkerTaskName =
    ProceduralWorkerTaskName,
> {
  readonly id: string;

  readonly task: TTask;

  readonly payload:
    ProceduralWorkerPayload<TTask>;
}

export type AnyProceduralWorkerRequest = {
  [TTask in ProceduralWorkerTaskName]:
    ProceduralWorkerRequest<TTask>;
}[ProceduralWorkerTaskName];

export interface ProceduralWorkerSuccessResponse<
  TTask extends ProceduralWorkerTaskName =
    ProceduralWorkerTaskName,
> {
  readonly id: string;

  readonly task: TTask;

  readonly ok: true;

  readonly result:
    ProceduralWorkerResult<TTask>;
}

export type AnyProceduralWorkerSuccessResponse = {
  [TTask in ProceduralWorkerTaskName]:
    ProceduralWorkerSuccessResponse<TTask>;
}[ProceduralWorkerTaskName];

export interface ProceduralWorkerErrorResponse {
  readonly id: string;

  readonly task: string;

  readonly ok: false;

  readonly error: {
    readonly message: string;
  };
}

export type AnyProceduralWorkerResponse =
  | AnyProceduralWorkerSuccessResponse
  | ProceduralWorkerErrorResponse;