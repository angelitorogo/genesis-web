import {
  GalacticMapParticleLayoutGenerator,
} from '../../galaxy-map/galactic-map-particle-layout';

import {
  createGalacticMapWorkerParticleSession,
  materializeGalacticMapWorkerFullLayout,
  type GalacticMapWorkerParticleSession,
} from './galactic-map-particle-worker-session';

import {
  AnyProceduralWorkerRequest,
  AnyProceduralWorkerResponse,
  ProceduralWorkerRuntime,
} from './procedural-worker.protocol';

const galacticMapParticleSessions =
  new Map<
    string,
    GalacticMapWorkerParticleSession
  >();

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
    switch (request.task) {
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

      case 'galactic-map-particle-session': {
        const payload =
          request.payload;

        assertSessionId(
          payload.sessionId,
        );

        galacticMapParticleSessions.delete(
          payload.sessionId,
        );

        const layout =
          GalacticMapParticleLayoutGenerator
            .generateFromRenderInput(
              payload.renderInput,
            );

        if (
          payload.indexConfig ===
            null
        ) {
          if (
            payload.window !==
              null
          ) {
            throw new RangeError(
              'A non-indexed galactic particle session cannot receive a sector window.',
            );
          }

          return {
            id,
            task:
              'galactic-map-particle-session',
            ok: true,
            result: {
              runtime,
              sessionId:
                payload.sessionId,
              batch:
                materializeGalacticMapWorkerFullLayout(
                  layout,
                ),
            },
          };
        }

        if (
          payload.window ===
            null
        ) {
          throw new RangeError(
            'An indexed galactic particle session requires an initial sector window.',
          );
        }

        const session =
          createGalacticMapWorkerParticleSession(
            layout,
            payload.indexConfig,
          );

        galacticMapParticleSessions.set(
          payload.sessionId,
          session,
        );

        return {
          id,
          task:
            'galactic-map-particle-session',
          ok: true,
          result: {
            runtime,
            sessionId:
              payload.sessionId,
            batch:
              session.materialize(
                payload.window,
              ),
          },
        };
      }

      case 'galactic-map-particle-window': {
        const payload =
          request.payload;

        assertSessionId(
          payload.sessionId,
        );

        const session =
          galacticMapParticleSessions.get(
            payload.sessionId,
          );

        if (
          session ===
            undefined
        ) {
          throw new Error(
            `Sesión de partículas galácticas inexistente: ${payload.sessionId}`,
          );
        }

        return {
          id,
          task:
            'galactic-map-particle-window',
          ok: true,
          result: {
            runtime,
            sessionId:
              payload.sessionId,
            batch:
              session.materialize(
                payload.window,
              ),
          },
        };
      }

      case 'galactic-map-particle-release': {
        const payload =
          request.payload;

        assertSessionId(
          payload.sessionId,
        );

        const session =
          galacticMapParticleSessions.get(
            payload.sessionId,
          );

        session?.clearCache();

        const released =
          galacticMapParticleSessions.delete(
            payload.sessionId,
          );

        return {
          id,
          task:
            'galactic-map-particle-release',
          ok: true,
          result: {
            runtime,
            sessionId:
              payload.sessionId,
            released,
          },
        };
      }

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

export function resetProceduralWorkerParticleSessionsForTests(): void {
  for (
    const session
    of galacticMapParticleSessions.values()
  ) {
    session.clearCache();
  }

  galacticMapParticleSessions.clear();
}

function assertSessionId(
  sessionId:
    string,
): void {

  if (
    sessionId.trim().length ===
      0
  ) {
    throw new RangeError(
      'sessionId must not be empty.',
    );
  }
}
