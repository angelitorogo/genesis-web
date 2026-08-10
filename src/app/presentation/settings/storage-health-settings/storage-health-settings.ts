import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  signal,
} from '@angular/core';

import {
  GenesisStorageAvailability,
  GenesisStorageContinuity,
  GenesisStoragePersistence,
  GenesisStoragePressure,
  GenesisStorageWritePolicy,
  type GenesisStorageHealthSnapshot,
} from '../../../domain/storage/genesis-storage-health';

import {
  GenesisBrowserStorageService,
} from '../../../data/local/storage/genesis-browser-storage.service';

import {
  GenesisIndexedDb,
} from '../../../data/local/indexed-db/genesis-indexed-db';

import {
  GenesisCard,
} from '../../../ui/components/genesis-card/genesis-card';

import {
  GenesisPrimaryButton,
} from '../../../ui/components/genesis-primary-button/genesis-primary-button';

@Component({
  selector:
    'app-storage-health-settings',

  standalone:
    true,

  imports: [
    GenesisCard,
    GenesisPrimaryButton,
  ],

  templateUrl:
    './storage-health-settings.html',

  styleUrl:
    './storage-health-settings.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class StorageHealthSettings
  implements OnInit, OnDestroy {

  private readonly database =
    new GenesisIndexedDb();

  private readonly storageService =
    new GenesisBrowserStorageService(
      this.database,
    );

  readonly health =
    signal<
      GenesisStorageHealthSnapshot | null
    >(
      null,
    );

  readonly checking =
    signal(
      false,
    );

  readonly requestingPersistence =
    signal(
      false,
    );

  readonly unexpectedError =
    signal<
      string | null
    >(
      null,
    );

  readonly status =
    computed(
      () => {
        const health =
          this.health();

        if (
          health ===
          null
        ) {
          return 'checking';
        }

        if (
          health.availability ===
          GenesisStorageAvailability
            .CLEARED
        ) {
          return 'recovery';
        }

        if (
          health.availability ===
          GenesisStorageAvailability
            .UNAVAILABLE
        ) {
          return 'error';
        }

        if (
          health.pressure ===
            GenesisStoragePressure.HIGH ||
          health.pressure ===
            GenesisStoragePressure.CRITICAL ||
          health.persistence ===
            GenesisStoragePersistence.BEST_EFFORT ||
          health.continuity ===
            GenesisStorageContinuity.UNVERIFIABLE
        ) {
          return 'warning';
        }

        return 'ready';
      },
    );

  readonly statusMessage =
    computed(
      () => {
        const health =
          this.health();

        if (
          health ===
          null
        ) {
          return 'Comprobando el almacenamiento local de GENESIS...';
        }

        if (
          health.availability ===
          GenesisStorageAvailability
            .CLEARED
        ) {
          return 'Se ha detectado que IndexedDB fue eliminado o recreado. El progreso persistido anterior no debe darse por recuperado. Restaura un backup antes de continuar con progreso persistente.';
        }

        if (
          health.availability ===
          GenesisStorageAvailability
            .UNAVAILABLE
        ) {
          return 'IndexedDB no está disponible. El universo determinista puede seguir calculándose, pero el progreso local no puede persistirse en este estado.';
        }

        if (
          health.pressure ===
          GenesisStoragePressure
            .CRITICAL
        ) {
          return 'La cuota de almacenamiento está en nivel crítico. GENESIS debe limitarse a escrituras esenciales.';
        }

        if (
          health.pressure ===
          GenesisStoragePressure
            .HIGH
        ) {
          return 'El uso de almacenamiento es alto. GENESIS debe priorizar únicamente las escrituras esenciales.';
        }

        if (
          health.continuity ===
          GenesisStorageContinuity
            .UNVERIFIABLE
        ) {
          return 'IndexedDB funciona, pero no es posible verificar externamente si el almacenamiento fue limpiado anteriormente.';
        }

        if (
          health.persistence ===
          GenesisStoragePersistence
            .BEST_EFFORT
        ) {
          return 'IndexedDB funciona correctamente, pero el navegador todavía trata este almacenamiento como no persistente.';
        }

        if (
          health.persistence ===
          GenesisStoragePersistence
            .PERSISTENT
        ) {
          return 'IndexedDB está disponible y el navegador ha concedido almacenamiento persistente.';
        }

        return 'IndexedDB está disponible y operativo.';
      },
    );

  readonly quotaMessage =
    computed(
      () => {
        const quota =
          this.health()
            ?.quota;

        if (
          quota ===
            undefined ||
          quota.usageBytes ===
            null ||
          quota.quotaBytes ===
            null ||
          quota.usageRatio ===
            null
        ) {
          return 'Cuota: no disponible.';
        }

        return (
          `Cuota: ${formatBytes(quota.usageBytes)} usados de ` +
          `${formatBytes(quota.quotaBytes)} ` +
          `(${(quota.usageRatio * 100).toFixed(1)} %).`
        );
      },
    );

  readonly persistenceMessage =
    computed(
      () => {
        const persistence =
          this.health()
            ?.persistence;

        switch (
          persistence
        ) {
          case GenesisStoragePersistence
            .PERSISTENT:
            return 'Persistencia: concedida.';

          case GenesisStoragePersistence
            .BEST_EFFORT:
            return 'Persistencia: no garantizada por el navegador.';

          case GenesisStoragePersistence
            .UNSUPPORTED:
            return 'Persistencia: API no disponible.';

          case GenesisStoragePersistence
            .UNKNOWN:
            return 'Persistencia: estado desconocido.';

          default:
            return 'Persistencia: pendiente de comprobar.';
        }
      },
    );

  readonly writePolicyMessage =
    computed(
      () => {
        const policy =
          this.health()
            ?.writePolicy;

        switch (
          policy
        ) {
          case GenesisStorageWritePolicy
            .NORMAL:
            return 'Escrituras locales: normales.';

          case GenesisStorageWritePolicy
            .ESSENTIAL_ONLY:
            return 'Escrituras locales: solo esenciales.';

          case GenesisStorageWritePolicy
            .BLOCKED:
            return 'Escrituras persistentes: bloqueadas por seguridad.';

          default:
            return 'Escrituras locales: pendiente de comprobar.';
        }
      },
    );

  readonly canRequestPersistence =
    computed(
      () => {
        const health =
          this.health();

        return (
          health !==
            null &&
          health.availability ===
            GenesisStorageAvailability
              .AVAILABLE &&
          health.persistence !==
            GenesisStoragePersistence
              .PERSISTENT &&
          health.persistence !==
            GenesisStoragePersistence
              .UNSUPPORTED
        );
      },
    );

  ngOnInit():
    void {

    void this.refresh();
  }

  ngOnDestroy():
    void {

    this.database
      .closeDatabase();
  }

  async refresh():
    Promise<void> {

    if (
      this.checking()
    ) {
      return;
    }

    this.checking.set(
      true,
    );

    this.unexpectedError.set(
      null,
    );

    try {
      this.health.set(
        await this.storageService
          .inspect(),
      );
    } catch (
      error: unknown
    ) {
      this.unexpectedError.set(
        error instanceof
          Error
          ? error.message
          : 'No se ha podido comprobar el almacenamiento local.',
      );
    } finally {
      this.checking.set(
        false,
      );
    }
  }

  async requestPersistence():
    Promise<void> {

    if (
      this.requestingPersistence()
    ) {
      return;
    }

    this.requestingPersistence.set(
      true,
    );

    this.unexpectedError.set(
      null,
    );

    try {
      await this.storageService
        .requestPersistentStorage();

      await this.refresh();
    } catch (
      error: unknown
    ) {
      this.unexpectedError.set(
        error instanceof
          Error
          ? error.message
          : 'No se ha podido solicitar almacenamiento persistente.',
      );
    } finally {
      this.requestingPersistence.set(
        false,
      );
    }
  }
}

function formatBytes(
  bytes:
    number,
): string {

  if (
    bytes <
    1024
  ) {
    return `${bytes.toFixed(0)} B`;
  }

  const kib =
    bytes /
    1024;

  if (
    kib <
    1024
  ) {
    return `${kib.toFixed(1)} KiB`;
  }

  const mib =
    kib /
    1024;

  if (
    mib <
    1024
  ) {
    return `${mib.toFixed(1)} MiB`;
  }

  return `${(
    mib /
    1024
  ).toFixed(2)} GiB`;
}