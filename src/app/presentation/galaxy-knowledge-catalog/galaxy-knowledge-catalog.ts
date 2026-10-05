import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import {
  GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES,
  type GalaxyKnowledgeCatalogAction,
  type GalaxyKnowledgeCatalogPageSize,
} from './galaxy-knowledge-catalog.model';

@Component({
  selector: 'app-galaxy-knowledge-catalog-page',
  standalone: true,
  imports: [GenesisScreen, RouterLink],
  templateUrl: './galaxy-knowledge-catalog.html',
  styleUrl: './galaxy-knowledge-catalog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GalaxyKnowledgeCatalogPage implements OnInit {
  readonly facade = inject(GalaxyKnowledgeCatalogFacade);
  readonly pageSizes = GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    combineLatest([
      this.route.paramMap,
      this.route.queryParamMap,
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([params, queryParams]) => {
        void this.facade.load(
          params.get('galaxyIndex'),
          params.get('category'),
          queryParams.get('u'),
          {
            subtype: queryParams.get('type'),
            page: queryParams.get('page'),
            pageSize: queryParams.get('size'),
            sortKey: queryParams.get('sort'),
            direction: queryParams.get('direction'),
          },
        );
      });
  }

  async changeSort(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    await this.navigateQuery({ sort: target.value, page: '1' });
  }

  async changeDirection(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    await this.navigateQuery({ direction: target.value, page: '1' });
  }

  async changePageSize(event: Event): Promise<void> {
    const target = event.target as HTMLSelectElement | null;
    if (target === null) return;
    const size = Number(target.value) as GalaxyKnowledgeCatalogPageSize;
    if (!GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES.includes(size)) return;
    await this.navigateQuery({ size: size.toString(), page: '1' });
  }

  pageQueryParams(page: number): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    return this.queryParams({ page: page.toString() });
  }

  actionQueryParams(action: GalaxyKnowledgeCatalogAction): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    return Object.freeze({
      u: model.routeUniverseRef,
      ...(action.queryParams ?? {}),
    });
  }

  formatCount(value: number): string {
    return value.toLocaleString('es-ES');
  }

  rowTrackKey(id: string): string {
    return id;
  }

  private async navigateQuery(
    changes: Readonly<Record<string, string>>,
  ): Promise<void> {
    const params = this.queryParams(changes);
    if (params === null) return;
    await this.router.navigate([], {
      relativeTo: this.route,
      queryParams: params,
    });
  }

  private queryParams(
    changes: Readonly<Record<string, string>>,
  ): Readonly<Record<string, string>> | null {
    const model = this.facade.model();
    if (model === null) return null;
    const params: Record<string, string> = {
      u: model.routeUniverseRef,
      page: model.query.page.toString(),
      size: model.query.pageSize.toString(),
      sort: model.query.sortKey,
      direction: model.query.direction,
    };
    if (model.query.subtype !== null) {
      params['type'] = model.query.subtype;
    }
    Object.assign(params, changes);
    return Object.freeze(params);
  }
}
