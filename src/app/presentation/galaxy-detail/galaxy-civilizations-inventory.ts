import { ChangeDetectionStrategy, Component, Input, OnChanges, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import {
  GalaxyCivilizationKnownIndex,
  type KnownGalacticCivilizationCensus,
} from '../galaxy-knowledge-catalog/galaxy-civilization-known-index';

/** Presentación con la misma estructura que los demás inventarios galácticos.
 * El recuento no muestra resultados intermedios: sólo registros validados de
 * sistemas confirmados, consultados en lectura de VIDA.9. */
@Component({
  selector: 'app-galaxy-civilizations-inventory',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {'[class.gci-expanded]': 'expanded'},
  template: `
    <details class="gci__details" data-testid="galaxy-civilizations-breakdown" (toggle)="onDetailsToggle($event)">
      <summary>
        <span>CIVILIZACIONES</span>
        <strong data-testid="galaxy-detail-known-civilizations">
          @if (census(); as result) {
            @if (result.complete || result.entries.length > 0) {
            <a class="gci__catalog-count-link"
               [routerLink]="catalogueRoute()"
               [queryParams]="{u: routeUniverseRef}"
               (click)="$event.stopPropagation()"
               data-testid="galaxy-detail-civilizations-catalog-link">
              {{ result.entries.length.toLocaleString('es-ES') }}
            </a>
            } @else {
              <span aria-label="Recuento aún no verificable">—</span>
            }
          } @else {
            <span aria-label="Recuento de civilizaciones en preparación">—</span>
          }
        </strong>
      </summary>
      @if (census(); as result) {
        <dl class="gci__rail-facts">
          <div>
            <dt>PRIMITIVAS</dt>
            <dd>
              <a class="gci__catalog-count-link"
                 [routerLink]="catalogueRoute()"
                 [queryParams]="{u: routeUniverseRef, type: 'PRIMITIVE'}"
                 data-testid="galaxy-detail-civilizations-primitive-link">
                {{ (result.complete || result.entries.length > 0) ? result.primitive.toLocaleString('es-ES') : '—' }}
              </a>
            </dd>
          </div>
          <div>
            <dt>AVANZADAS</dt>
            <dd>
              <a class="gci__catalog-count-link"
                 [routerLink]="catalogueRoute()"
                 [queryParams]="{u: routeUniverseRef, type: 'ADVANCED'}"
                 data-testid="galaxy-detail-civilizations-advanced-link">
                {{ (result.complete || result.entries.length > 0) ? result.advanced.toLocaleString('es-ES') : '—' }}
              </a>
            </dd>
          </div>
          <div>
            <dt>MUY AVANZADAS</dt>
            <dd>
              <a class="gci__catalog-count-link"
                 [routerLink]="catalogueRoute()"
                 [queryParams]="{u: routeUniverseRef, type: 'VERY_ADVANCED'}"
                 data-testid="galaxy-detail-civilizations-very-advanced-link">
                {{ (result.complete || result.entries.length > 0) ? result.veryAdvanced.toLocaleString('es-ES') : '—' }}
              </a>
            </dd>
          </div>
        </dl>
        @if (!result.complete) {
          <p class="gci__status" role="status">Inventario parcial: falta materializar o verificar algunos sistemas confirmados.</p>
        }
      } @else if (error()) {
        <p class="gci__status" role="alert">No se pudo consultar el inventario de civilizaciones.</p>
      } @else if (loading()) {
        <p class="gci__status" role="status">Consultando las civilizaciones conocidas…</p>
      }
    </details>
  `,
  styles: [`
    :host {
      display: block;
      min-width: 0;
      padding: .8rem;
      border: 1px solid rgba(106, 215, 255, .1);
      border-radius: var(--genesis-radius-md, .7rem);
      color: inherit;
    }
    :host(.gci-expanded) { grid-column: 1 / -1; }
    .gci__details summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      list-style: none;
      cursor: pointer;
    }
    .gci__details summary::-webkit-details-marker { display: none; }
    .gci__rail-facts {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: .65rem;
      margin: .85rem 0 0;
    }
    .gci__rail-facts > div {
      min-width: 0;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: .6rem;
      padding: .4rem 0;
    }
    .gci__rail-facts dt {
      color: var(--genesis-color-text-subtle, #8da1b6);
      font: 700 .68rem var(--genesis-font-mono, monospace);
      letter-spacing: .11em;
      text-transform: uppercase;
    }
    .gci__rail-facts dd { margin: 0; white-space: nowrap; }
    .gci__catalog-count-link { color: inherit; text-decoration: none; }
    .gci__catalog-count-link:hover,
    .gci__catalog-count-link:focus-visible { color: var(--genesis-color-primary, #78dfff); }
    .gci__catalog-count-link:focus-visible { outline: 1px solid currentColor; outline-offset: .16rem; }
    .gci__status { margin: .85rem 0 0; color: var(--genesis-color-text-muted, #a6c4d8); font-size: .8rem; }
    @media (max-width: 680px) { .gci__rail-facts { grid-template-columns: 1fr; } }
  `],
})
export class GalaxyCivilizationsInventoryComponent implements OnChanges {
  @Input() generationKey: UniverseGenerationKey | null = null;
  @Input() galaxyIndex: bigint = 0n;
  @Input() routeUniverseRef = '';

  private readonly index = inject(GalaxyCivilizationKnownIndex);
  expanded = false;
  onDetailsToggle(event: Event): void {
    this.expanded = (event.target as HTMLDetailsElement).open;
  }
  readonly census = signal<KnownGalacticCivilizationCensus | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  private sequence = 0;
  private lastRequest = '';

  catalogueRoute(): string[] {
    return ['/galaxies', this.galaxyIndex.toString(), 'knowledge', 'civilizations'];
  }

  ngOnChanges(): void {
    const generationKey = this.generationKey;
    const requestId = generationKey
      ? [generationKey.universeSeed.serialize(), generationKey.generatorVersionCode, this.galaxyIndex].join('/')
      : 'sin-universo';
    if (requestId === this.lastRequest) return;
    this.lastRequest = requestId;
    const n = ++this.sequence;
    this.census.set(null);
    this.error.set(false);
    if (!generationKey) {
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    // No suscribirse al progreso del índice: nunca mostrar 3, 8, 14, 24
    // conforme se procesan los lotes. Publicar sólo el censo terminado.
    void this.index.read(generationKey, this.galaxyIndex).then(result => {
      if (n !== this.sequence) return;
      this.census.set(result);
      this.loading.set(false);
    }).catch((error:unknown) => {
      console.error('Civilizaciones: fallo al leer conocimiento galáctico confirmado',error);
      if (n !== this.sequence) return;
      this.error.set(true);
      this.loading.set(false);
    });
  }
}
