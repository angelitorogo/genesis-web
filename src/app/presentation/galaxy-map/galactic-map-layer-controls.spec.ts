import { TestBed } from '@angular/core/testing';
import { GalacticMapLayerControls } from './galactic-map-layer-controls';
import { GalacticMapLayerId, INITIAL_GALACTIC_MAP_LAYER_VISIBILITY } from './galactic-map-layer-state';
import { GalacticMapExplorationCoverage } from './galactic-map-exploration-coverage';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GalaxySectorGrid } from '../../domain/sector/galaxy-sector-grid';
import { GalaxySectorCoordinates } from '../../domain/sector/galaxy-sector-coordinates';

describe('GalacticMapLayerControls — panel compacto', () => {
  const key = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
  const coverage = new GalacticMapExplorationCoverage(key, 0n,
    new GalaxySectorGrid(key, 0n, 1000, 2),
    [new GalaxySectorCoordinates(0, 0), new GalaxySectorCoordinates(2, -2)]);
  const fixture = () => {
    const f = TestBed.createComponent(GalacticMapLayerControls);
    f.componentRef.setInput('visibility', INITIAL_GALACTIC_MAP_LAYER_VISIBILITY);
    f.componentRef.setInput('explorationCoverage', coverage);
    f.componentRef.setInput('exploredShadingVisible', true);
    f.detectChanges();
    return f;
  };

  it('shows six thematic layers, one shading switch and only sector counters', () => {
    const f = fixture();
    const root = f.nativeElement as HTMLElement;
    expect(root.querySelectorAll('[data-testid^="galactic-map-layer-"]')).toHaveLength(7);
    expect(root.querySelector('[data-testid="galactic-map-explored-sector-count"]')?.textContent).toBe('2');
    expect(root.querySelector('[data-testid="galactic-map-unexplored-sector-count"]')?.textContent).toBe('23');
    expect(root.textContent).not.toContain('SPECULATIVE_SIMPLIFIED');
  });

  it('toggles sector shading without changing existing six thematic layers', () => {
    const f = fixture();
    const root = f.nativeElement as HTMLElement;
    const changes: boolean[] = [];
    const layerChanges: unknown[] = [];
    f.componentInstance.exploredShadingVisibleChange.subscribe(v => changes.push(v));
    f.componentInstance.visibilityChange.subscribe(v => layerChanges.push(v));
    (root.querySelector('[data-testid="galactic-map-layer-explored-shading"]') as HTMLButtonElement).click();
    expect(changes).toEqual([false]);
    expect(layerChanges).toEqual([]);
    (root.querySelector('[data-testid="galactic-map-layer-nebulae"]') as HTMLButtonElement).click();
    expect(layerChanges).toEqual([{layerId: GalacticMapLayerId.NEBULAE, visible: false}]);
  });
});
