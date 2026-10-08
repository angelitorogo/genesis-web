import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest } from 'rxjs';

import { GenesisScreen } from '../../ui/layout/genesis-screen/genesis-screen';
import { GalaxyKnowledgeCatalogFacade } from './galaxy-knowledge-catalog.facade';
import {
  GALAXY_KNOWLEDGE_CATALOG_PAGE_SIZES,
  galaxyKnowledgeCatalogColumnsForLayout,
  galaxyKnowledgeCatalogHiddenFields,
  galaxyKnowledgeCatalogVisibleFields,
  normalizeGalaxyKnowledgeCatalogColumnLayout,
  type GalaxyKnowledgeCatalogAction,
  type GalaxyKnowledgeCatalogColumn,
  type GalaxyKnowledgeCatalogColumnLayout,
  type GalaxyKnowledgeCatalogDescriptor,
  type GalaxyKnowledgeCatalogField,
  type GalaxyKnowledgeCatalogPageSize,
} from './galaxy-knowledge-catalog.model';
import {
  galaxyKnowledgeCatalogLayoutFromStoredPreference,
  readGalaxyKnowledgeCatalogColumnPreferences,
  saveGalaxyKnowledgeCatalogColumnPreferences,
  withGalaxyKnowledgeCatalogColumnPreference,
  withoutGalaxyKnowledgeCatalogColumnPreference,
  type GalaxyKnowledgeCatalogColumnPreferences,
} from './galaxy-knowledge-catalog-column-preferences';

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
  readonly columnsPanelOpen = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly columnPreferences = signal<GalaxyKnowledgeCatalogColumnPreferences>(
    readGalaxyKnowledgeCatalogColumnPreferences(),
  );

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
    const model = this.facade.model();
    if (model !== null) {
      this.ensureColumnVisible(model.descriptor, target.value);
    }
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

  toggleColumnsPanel(): void {
    this.columnsPanelOpen.update(value => !value);
  }

  visibleColumns(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
  ): readonly GalaxyKnowledgeCatalogColumn[] {
    return galaxyKnowledgeCatalogColumnsForLayout(
      descriptor,
      this.columnLayout(descriptor),
    );
  }

  visibleColumnFields(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
  ): readonly GalaxyKnowledgeCatalogField[] {
    return galaxyKnowledgeCatalogVisibleFields(
      descriptor,
      this.columnLayout(descriptor),
    );
  }

  hiddenColumnFields(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
  ): readonly GalaxyKnowledgeCatalogField[] {
    return galaxyKnowledgeCatalogHiddenFields(
      descriptor,
      this.columnLayout(descriptor),
    );
  }

  visibleColumnCount(descriptor: GalaxyKnowledgeCatalogDescriptor): number {
    return this.columnLayout(descriptor).visibleFieldKeys.length;
  }

  async changeColumnVisibility(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    fieldKey: string,
    event: Event,
  ): Promise<void> {
    const target = event.target as HTMLInputElement | null;
    if (target === null) return;

    const layout = this.columnLayout(descriptor);
    const visible = [...layout.visibleFieldKeys];
    const currentIndex = visible.indexOf(fieldKey);

    if (target.checked) {
      if (currentIndex < 0 && this.isConfigurableField(descriptor, fieldKey)) {
        visible.push(fieldKey);
      }
    } else if (currentIndex >= 0) {
      visible.splice(currentIndex, 1);
    }

    this.setColumnLayout(descriptor, Object.freeze({
      visibleFieldKeys: Object.freeze(visible),
    }));

    const model = this.facade.model();
    if (
      !target.checked
      && model !== null
      && model.descriptor.category === descriptor.category
      && model.query.sortKey === fieldKey
    ) {
      await this.navigateQuery({ sort: descriptor.defaultSortKey, page: '1' });
    }
  }

  moveVisibleColumn(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    fieldKey: string,
    offset: -1 | 1,
  ): void {
    const visible = [...this.columnLayout(descriptor).visibleFieldKeys];
    const index = visible.indexOf(fieldKey);
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= visible.length) return;
    [visible[index], visible[targetIndex]] = [visible[targetIndex]!, visible[index]!];
    this.setColumnLayout(descriptor, Object.freeze({
      visibleFieldKeys: Object.freeze(visible),
    }));
  }

  canMoveVisibleColumn(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    fieldKey: string,
    offset: -1 | 1,
  ): boolean {
    const visible = this.columnLayout(descriptor).visibleFieldKeys;
    const index = visible.indexOf(fieldKey);
    const targetIndex = index + offset;
    return index >= 0 && targetIndex >= 0 && targetIndex < visible.length;
  }

  async resetColumns(descriptor: GalaxyKnowledgeCatalogDescriptor): Promise<void> {
    const next = withoutGalaxyKnowledgeCatalogColumnPreference(
      this.columnPreferences(),
      descriptor.category,
    );
    this.columnPreferences.set(next);
    saveGalaxyKnowledgeCatalogColumnPreferences(next);
    const model = this.facade.model();
    if (model === null || model.descriptor.category !== descriptor.category) return;
    const sortField = descriptor.fields.find(field => field.key === model.query.sortKey);
    if (sortField?.role === 'data' && !sortField.defaultVisible) {
      await this.navigateQuery({ sort: descriptor.defaultSortKey, page: '1' });
    }
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

  private columnLayout(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
  ): GalaxyKnowledgeCatalogColumnLayout {
    const base = galaxyKnowledgeCatalogLayoutFromStoredPreference(
      descriptor,
      this.columnPreferences()[descriptor.category],
    );
    const model = this.facade.model();
    if (model === null || model.descriptor.category !== descriptor.category) {
      return base;
    }
    const sortField = descriptor.fields.find(field => field.key === model.query.sortKey);
    if (
      sortField === undefined
      || sortField.role !== 'data'
      || base.visibleFieldKeys.includes(sortField.key)
    ) {
      return base;
    }
    return normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, Object.freeze({
      visibleFieldKeys: Object.freeze([...base.visibleFieldKeys, sortField.key]),
    }));
  }

  private setColumnLayout(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    layout: GalaxyKnowledgeCatalogColumnLayout,
  ): void {
    const normalized = normalizeGalaxyKnowledgeCatalogColumnLayout(descriptor, layout);
    const next = withGalaxyKnowledgeCatalogColumnPreference(
      this.columnPreferences(),
      descriptor,
      normalized,
    );
    this.columnPreferences.set(next);
    saveGalaxyKnowledgeCatalogColumnPreferences(next);
  }

  private ensureColumnVisible(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    fieldKey: string,
  ): void {
    const field = descriptor.fields.find(candidate => candidate.key === fieldKey);
    if (field === undefined || field.role !== 'data') return;
    const layout = this.columnLayout(descriptor);
    if (layout.visibleFieldKeys.includes(fieldKey)) return;
    this.setColumnLayout(descriptor, Object.freeze({
      visibleFieldKeys: Object.freeze([...layout.visibleFieldKeys, fieldKey]),
    }));
  }

  private isConfigurableField(
    descriptor: GalaxyKnowledgeCatalogDescriptor,
    fieldKey: string,
  ): boolean {
    return descriptor.fields.some(field => field.key === fieldKey && field.role === 'data');
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
