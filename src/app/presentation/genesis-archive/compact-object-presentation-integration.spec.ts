import { TestBed } from '@angular/core/testing';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ArchiveGalacticObjectCardAssembler } from './archive-galactic-object-card';
import { ArchiveStellarSystemKnowledgeLevel } from './archive-stellar-system-card';
import { compactObjectScientificVisual } from './compact-object-scientific-visual';
import { GalacticObjectProceduralRender } from './galactic-object-procedural-render';
import { StellarSystemProceduralRender } from './stellar-system-procedural-render';

describe('27.10 — actual scientific presentation integration', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StellarSystemProceduralRender, GalacticObjectProceduralRender],
    }).compileComponents();
  });

  it('draws an existing compact system component with no optical corona or invented disk', () => {
    const fixture = TestBed.createComponent(StellarSystemProceduralRender);
    fixture.componentRef.setInput('descriptor', {
      accessibleLabel: 'Compact A schematic',
      knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
      multiplicity: StellarSystemMultiplicity.SINGLE,
      components: [{ label: 'A', colorHex: '#e6c49a', radiusScale: 0.8, massSolar: 7,
        compactVisual: compactObjectScientificVisual('BLACK_HOLE') }],
      innerOrbitEccentricity: null, outerOrbitEccentricity: null,
      stableHabitableZoneFraction: null, hasStableHabitableZone: false,
    });
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-star-treatment="COMPACT_SCHEMATIC_27_10"]')).toBeTruthy();
    expect(root.querySelector('[data-compact-kind="BLACK_HOLE"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="stellar-system-render-single-corona"]')).toBeNull();
    expect(root.querySelector('[data-testid="stellar-system-render-single-bloom"]')).toBeNull();
  });

  it('never draws a hidden IMBH silhouette before scientific cataloguing', () => {
    const key = new UniverseGenerationKey(UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V2);
    const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);
    const fixture = TestBed.createComponent(GalacticObjectProceduralRender);
    for (const state of [DiscoveryState.DETECTED, DiscoveryState.DISCOVERED]) {
      const card = ArchiveGalacticObjectCardAssembler.build(
        key, rare, ExplorationResultKind.EXTREME_OBJECT, state);
      fixture.componentRef.setInput('descriptor', card.render);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('[data-testid="compact-science-shadow"]')).toBeNull();
      expect(root.querySelector('[data-testid="compact-science-disk"]')).toBeNull();
      expect(root.querySelector('[data-testid="compact-science-jets"]')).toBeNull();
      expect(root.textContent).not.toContain('Agujero negro de masa intermedia');
    }
    const catalogued = ArchiveGalacticObjectCardAssembler.build(
      key, rare, ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.CATALOGUED);
    fixture.componentRef.setInput('descriptor', catalogued.render);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement)
      .querySelector('[data-testid="compact-science-shadow"]')).toBeTruthy();
  });

  it('routes a real catalogued IMBH to the compact diagram, never to an invented cloud', () => {
    const key = new UniverseGenerationKey(UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
    const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);
    const card = ArchiveGalacticObjectCardAssembler.build(
      key, rare, ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.CATALOGUED);
    const fixture = TestBed.createComponent(GalacticObjectProceduralRender);
    fixture.componentRef.setInput('descriptor', card.render);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="compact-science-shadow"]')).toBeTruthy();
    expect(root.querySelector('[data-testid="compact-science-disk"]')).toBeNull();
    expect(root.querySelector('[data-testid="compact-science-jets"]')).toBeNull();
  });
});
