import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  GenesisCard,
} from '../../ui/components/genesis-card/genesis-card';
import {
  GenesisPrimaryButton,
} from '../../ui/components/genesis-primary-button/genesis-primary-button';
import {
  GenesisSectionTitle,
} from '../../ui/components/genesis-section-title/genesis-section-title';
import {
  GenesisScreen,
} from '../../ui/layout/genesis-screen/genesis-screen';

import {
  ProceduralWorkerClient,
} from '../runtime/procedural-worker/procedural-worker.client';

import {
  UniverseSeedSettings,
} from './universe-seed-settings/universe-seed-settings';

type WorkerDiagnosticStatus =
  | 'idle'
  | 'checking'
  | 'ready'
  | 'fallback'
  | 'error';

interface WorkerDiagnostic {
  readonly status:
    WorkerDiagnosticStatus;

  readonly message: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    GenesisCard,
    GenesisPrimaryButton,
    GenesisScreen,
    GenesisSectionTitle,
    UniverseSeedSettings,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Settings {
  private readonly workerClient =
    inject(
      ProceduralWorkerClient,
    );

  readonly workerDiagnostic =
    signal<WorkerDiagnostic>({
      status: 'idle',

      message:
        'El runtime procedural todavía no se ha comprobado.',
    });

  async verifyWorker(): Promise<void> {
    if (
      this.workerDiagnostic()
        .status ===
      'checking'
    ) {
      return;
    }

    this.workerDiagnostic.set({
      status:
        'checking',

      message:
        'Comprobando el runtime procedural...',
    });

    try {
      const result =
        await this.workerClient
          .healthCheck();

      if (
        result.runtime ===
        'worker'
      ) {
        this.workerDiagnostic.set({
          status:
            'ready',

          message:
            'Web Worker activo. Los cálculos procedurales podrán ejecutarse fuera del hilo principal.',
        });

        return;
      }

      this.workerDiagnostic.set({
        status:
          'fallback',

        message:
          'Web Worker no disponible. GENESIS está utilizando el modo de compatibilidad en el hilo principal.',
      });
    } catch (
      error: unknown
    ) {
      this.workerDiagnostic.set({
        status:
          'error',

        message:
          error instanceof Error
            ? error.message
            : 'No se ha podido comprobar el Web Worker.',
      });
    }
  }
}