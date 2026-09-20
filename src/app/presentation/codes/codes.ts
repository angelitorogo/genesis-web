import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GENESIS_LOCAL_REPOSITORIES } from '../runtime/genesis-local-repositories';
import { UniverseSeedFacade } from '../universe/universe-seed.facade';
import { CODES_REDEMPTION_RUNTIME, TEST_PD_CODE } from './codes-redemption.runtime';

type Feedback = { readonly kind: 'success' | 'error' | 'info'; readonly message: string } | null;

@Component({
  selector: 'app-codes',
  standalone: true,
  imports: [GenesisScreen, RouterLink],
  templateUrl: './codes.html',
  styleUrl: './codes.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodesPage {
  private readonly repositories = inject(GENESIS_LOCAL_REPOSITORIES);
  private readonly selection = inject(UniverseSeedFacade);
  private readonly runtime = inject(CODES_REDEMPTION_RUNTIME);
  readonly code = signal(TEST_PD_CODE);
  readonly pending = signal(false);
  readonly feedback = signal<Feedback>(null);

  setCode(value: string): void {
    this.code.set(value);
    this.feedback.set(null);
  }

  async accept(event: Event): Promise<void> {
    event.preventDefault();
    if (this.pending()) return;
    this.pending.set(true);
    this.feedback.set(null);
    try {
      const universes = await this.repositories.universeRepository.getAll();
      const generationKey = this.selection.resolvePersistedUniverse(universes);
      if (generationKey === null) {
        this.feedback.set({ kind: 'error', message: 'Selecciona primero un universo guardado.' });
        return;
      }
      const result = await this.runtime.redeem(generationKey, this.code());
      switch (result.kind) {
        case 'awarded':
          this.code.set('');
          this.feedback.set({ kind: 'success', message: `Código aceptado: +${result.amount.toString()} PD. Saldo actual: ${result.balance.toString()} PD.` });
          break;
        case 'unlocked':
          this.code.set('');
          this.feedback.set({ kind: 'success', message: `Mejora ${result.size}×${result.size} desbloqueada. Abre Mapa galáctico y selecciona el tamaño del bloque antes de explorar.` });
          break;
        case 'already-redeemed':
          this.feedback.set({ kind: 'info', message: 'Este código ya se ha canjeado en este universo.' });
          break;
        case 'unsupported-version':
          this.feedback.set({ kind: 'error', message: 'El código de pruebas solo funciona en universos V2.' });
          break;
        case 'invalid-code':
          this.feedback.set({ kind: 'error', message: 'Código no válido o no disponible todavía.' });
          break;
      }
    } catch {
      this.feedback.set({ kind: 'error', message: 'No se ha podido guardar el canje. No se ha confirmado ningún premio.' });
    } finally {
      this.pending.set(false);
    }
  }
}
