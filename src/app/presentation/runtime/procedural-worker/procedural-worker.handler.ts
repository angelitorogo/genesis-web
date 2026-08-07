import {
  AnyProceduralWorkerRequest,
  AnyProceduralWorkerResponse,
  ProceduralWorkerRuntime,
} from './procedural-worker.protocol';

function errorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

export async function handleProceduralWorkerRequest(
  request: AnyProceduralWorkerRequest,
  runtime: ProceduralWorkerRuntime,
): Promise<AnyProceduralWorkerResponse> {
  const id =
    request.id;

  const task =
    request.task as string;

  try {
    switch (task) {
      case 'health-check':
        return {
          id,
          task: 'health-check',
          ok: true,
          result: {
            ready: true,
            runtime,
          },
        };

      default:
        return {
          id,
          task,
          ok: false,
          error: {
            message:
              `Tarea procedural no soportada: ${task}`,
          },
        };
    }
  } catch (error: unknown) {
    return {
      id,
      task,
      ok: false,
      error: {
        message:
          errorMessage(error),
      },
    };
  }
}