import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { ExplorationResultKind } from '../../domain/exploration/exploration-sector-result';
import { GalacticObjectLocator } from '../../domain/generation/procedural-locator';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { ArchiveGalacticObjectCardAssembler } from './archive-galactic-object-card';
import { ArchiveStellarSystemKnowledgeLevel } from './archive-stellar-system-card';
import { StellarSystemProceduralRenderModelBuilder } from './stellar-system-procedural-render-model';
import { compactObjectScientificVisual } from './compact-object-scientific-visual';

describe('27.10 — physical fiche and observation-gated rendering', () => {
  const generationKey = new UniverseGenerationKey(
    UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'), GeneratorVersion.V1);
  const rare = new GalacticObjectLocator(0n, -73014444020n, 0n);

  it('keeps an existing rare IMBH completely unclassified before cataloguing', () => {
    const detected = ArchiveGalacticObjectCardAssembler.build(generationKey, rare,
      ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.DETECTED);
    const discovered = ArchiveGalacticObjectCardAssembler.build(generationKey, rare,
      ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.DISCOVERED);
    expect(detected.facts).toEqual([]);
    expect(discovered.facts).toEqual([]);
    expect(detected.render.compactVisual).toBeUndefined();
    expect(discovered.render.compactVisual).toBeUndefined();
    expect(discovered.title).toContain('sin clasificación');
  });

  it('discloses a real IMBH only once catalogued and never invents gas or jets', () => {
    const card = ArchiveGalacticObjectCardAssembler.build(generationKey, rare,
      ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.CATALOGUED);
    expect(card.title).toBe('Agujero negro de masa intermedia');
    expect(card.scientificSections.map(section => section.id)).toEqual(['intermediate-black-hole']);
    expect(card.render.compactVisual?.kind).toBe('BLACK_HOLE');
    expect(card.render.compactVisual?.hasAccretionDisk).toBe(false);
    expect(card.render.compactVisual?.hasRelativisticJets).toBe(false);
  });

  it('gates active-nucleus compact physics while preserving the existing AGN renderer', () => {
    const centre = new GalacticObjectLocator(20n, 0n, 0n);
    const detected = ArchiveGalacticObjectCardAssembler.build(generationKey, centre,
      ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.DETECTED);
    const catalogued = ArchiveGalacticObjectCardAssembler.build(generationKey, centre,
      ExplorationResultKind.EXTREME_OBJECT, DiscoveryState.CATALOGUED);
    expect(detected.render.kind).toBe('AGN_NUCLEUS');
    expect(detected.render.compactVisual).toBeNull();
    expect(detected.facts.some(f => f.label.includes('Schwarzschild'))).toBe(false);
    expect(catalogued.render.kind).toBe('AGN_NUCLEUS');
    expect(catalogued.render.compactVisual?.hasAccretionDisk).toBe(true);
    expect(catalogued.render.compactVisual?.hasRelativisticJets).toBe(false);
    expect(catalogued.facts.some(f => f.label.includes('Schwarzschild'))).toBe(true);
  });

  it('passes an existing compact component into the schematic without inventing photons', () => {
    const model = StellarSystemProceduralRenderModelBuilder.build({
      accessibleLabel: 'Test remanent', knowledgeLevel: ArchiveStellarSystemKnowledgeLevel.CATALOGUED,
      multiplicity: StellarSystemMultiplicity.SINGLE,
      components: [{ label: 'A', colorHex: '#eeeeee', radiusScale: 0.1, massSolar: 7,
        compactVisual: compactObjectScientificVisual('BLACK_HOLE') }],
      innerOrbitEccentricity: null, outerOrbitEccentricity: null,
      stableHabitableZoneFraction: null, hasStableHabitableZone: false,
    });
    expect(model.components[0]?.compactVisual?.kind).toBe('BLACK_HOLE');
    expect(model.components[0]?.compactVisual?.hasAccretionDisk).toBe(false);
  });
});
