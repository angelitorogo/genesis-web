import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { StellarSystemMultiplicity } from '../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { ProceduralTargetResolver } from '../../simulation/regeneration/procedural-target-resolver';
import { StellarMultihostFormation } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarSystemMultiplicitySelector } from '../../simulation/stellar/stellar-system-multiplicity-selector';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { ArchiveV2StellarSystemCardAssembler } from '../genesis-archive/archive-v2-stellar-system-card';
import { systemSceneGameplayHostLayout, systemSceneHabitableZoneHostLabel } from './system-scene-gameplay-hosts';
import { laboratoryStarDistances, productionStarFocusRadius } from './system-scene-laboratory-controls';
import { SYSTEM_SCENE_RUNTIME_FACTORY, SystemScene, type SystemSceneRuntime } from './system-scene';
import { SystemMultihostGameCutover } from './system-multihost-game-cutover';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1');
const legacy = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);

function locate(multiplicity: StellarSystemMultiplicity): SystemLocator {
  for (let index = 0n; index < 512n; index++) {
    const locator = new SystemLocator(0n, 0n, index);
    const resolved = ProceduralTargetResolver.resolveTargetSeed(legacy, locator);
    if (StellarSystemMultiplicitySelector.select(legacy, resolved as Parameters<
      typeof StellarSystemMultiplicitySelector.select>[1]) === multiplicity) return locator;
  }
  throw new Error(`Missing physical ${multiplicity.name} fixture.`);
}

function realV2(multiplicity: StellarSystemMultiplicity) {
  const locator = locate(multiplicity);
  const state = DiscoveryState.CONFIRMED;
  const model = {
    universeSeed: seed.serialize(), generatorVersionCode: v2.generatorVersionCode,
    locatorKind: ArchiveDiscoveryLocatorKind.SYSTEM,
    galaxyIndex: locator.galaxyIndex, sectorKey: locator.sectorKey,
    galacticObjectIndex: locator.galacticObjectIndex,
    proceduralIdentity: `G${locator.galaxyIndex} / S${locator.sectorKey} / O${locator.galacticObjectIndex}`,
    discoveryState: state, discoveryStateLabel: state.name,
    stellarSystemCard: ArchiveV2StellarSystemCardAssembler.build(v2, locator, state),
  } as unknown as ArchiveDiscoveryDetailModel;
  const session = SystemMultihostGameCutover.sessionOrNull(model)!;
  const formation = StellarMultihostFormation.generateOrNull(v2, locator)!;
  if (!session || !formation) throw new Error('Unresolved V2 fixture.');
  return { model, snapshot: session.scene, formation };
}

describe('13.3: production V2 renderer and controls share the scientific source', () => {
  it.each([StellarSystemMultiplicity.BINARY, StellarSystemMultiplicity.TRIPLE])(
    '%s preserves public identities, S/P population, scene motions and live physical AU', multiplicity => {
      const { model, snapshot, formation } = realV2(multiplicity);
      expect(snapshot.proceduralIdentity).toBe(model.proceduralIdentity);
      expect(snapshot.proceduralIdentity).not.toContain(formation.parentSystemSeedHex);
      expect(snapshot.generatorVersionCode).toBe(2);
      const hosts = systemSceneGameplayHostLayout(snapshot);
      expect(hosts.map(host => host.label)).toEqual(multiplicity === StellarSystemMultiplicity.TRIPLE
        ? ['A', 'B', 'C', 'A–B'] : ['A', 'B', 'A–B']);
      expect(hosts.reduce((count, host) => count + host.planetCount, 0)).toBe(formation.publicPlanets.length);
      expect(hosts.find(host => host.topology === 'P')?.planetCount).toBe(formation.circumbinary.planets.length);
      for (const host of hosts.filter(host => host.topology === 'S')) {
        expect(host.planetCount).toBe(formation.publicPlanets.filter(entry => entry.host === host.label).length);
      }
      expect(snapshot.planets.length).toBe(formation.publicPlanets.length);
      expect(snapshot.scientificPlanetBindings?.length).toBe(snapshot.planets.length);
      expect(snapshot.scientificMoonBindings?.length).toBe(snapshot.moons.length);
      const distances = laboratoryStarDistances(snapshot, 300 * snapshot.simulation.playbackDaysPerRealSecond);
      expect(distances.length).toBe(multiplicity === StellarSystemMultiplicity.TRIPLE ? 3 : 1);
      expect(distances.every(value => Number.isFinite(value.au) && value.au > 0)).toBe(true);
      snapshot.stars.forEach(star => {
        const radius = productionStarFocusRadius(snapshot, star.id);
        expect(radius).toBeGreaterThan(star.opticalRadiusScene ?? star.radiusScene);
        for (const orbit of snapshot.orbits.filter(orbit =>
          orbit.id.startsWith(`mh-${star.label.toLowerCase()}-`) && orbit.kind === 'planetary')) {
          expect(radius).toBeGreaterThan(orbit.semiMajorScene + Math.abs(orbit.focusOffsetScene));
        }
        for (const zone of snapshot.habitableZones ?? []) {
          if (systemSceneHabitableZoneHostLabel(snapshot, zone) === `Estrella ${star.label} · S`) {
            expect(radius).toBeGreaterThan(zone.radiativeOuterRadiusScene);
          }
        }
      });
      const zones = snapshot.habitableZones ?? [];
      expect(zones.map(zone => systemSceneHabitableZoneHostLabel(snapshot, zone)).slice(0, snapshot.stars.length))
        .toEqual(snapshot.stars.map(star => `Estrella ${star.label} · S`));
      const p = zones.find(zone => zone.topology === 'CIRCUMBINARY');
      if (p) expect(systemSceneHabitableZoneHostLabel(snapshot, p)).toBe('Baricentro A–B · P');
      expect(systemSceneGameplayHostLayout({ ...snapshot, generatorVersionCode: 1 })).toEqual([]);
      expect(() => productionStarFocusRadius(snapshot, 'mh-p-planet-1')).toThrow(RangeError);
    }, 120_000,
  );

  it('renders gameplay host counts and orbit/focus controls without creating a new planetary population', async () => {
    const { snapshot } = realV2(StellarSystemMultiplicity.BINARY);
    const render = vi.fn().mockReturnValue(Object.freeze({
      renderer: 'WEBGL2' as const, shaderPipeline: 'GLSL_WEBGL2_V1' as const,
      webGpuEvaluation: 'API_UNAVAILABLE' as const, physicalBodyCount: snapshot.planets.length,
      sceneObjectCount: snapshot.planets.length + snapshot.stars.length,
    }));
    const focus = vi.fn((_id: string, _radius: number) => true);
    const layers = vi.fn();
    const runtime: SystemSceneRuntime = {
      resize: vi.fn(), render, dispose: vi.fn(), resetView: vi.fn(),
      focusLaboratorySystem: focus, setLayerVisibility: layers,
    };
    await TestBed.configureTestingModule({ imports: [SystemScene],
      providers: [provideRouter([]), { provide: SYSTEM_SCENE_RUNTIME_FACTORY, useValue: () => runtime }],
    }).compileComponents();
    const fixture = TestBed.createComponent(SystemScene);
    fixture.componentRef.setInput('snapshot', snapshot);
    fixture.componentRef.setInput('gameplaySceneControls', true);
    fixture.componentRef.setInput('laboratoryCloseZoom', true);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(render).toHaveBeenCalledWith(snapshot, true);
    expect(root.querySelectorAll('[data-testid="system-scene-v2-host"]')).toHaveLength(3);
    expect(root.querySelector('[data-testid="system-scene-v2-host-layout"]')?.textContent).toContain('V2');
    expect(root.querySelector('[data-testid="system-scene-v2-host"][data-topology="P"]')?.textContent)
      .toContain('A–B');
    const orbit = root.querySelector<HTMLButtonElement>('[data-testid="system-scene-lab-orbit-lines"]')!;
    orbit.click(); fixture.detectChanges();
    expect(layers).toHaveBeenLastCalledWith(expect.objectContaining({ orbits: false }));
    const stars = root.querySelectorAll<HTMLButtonElement>('[data-testid="system-scene-lab-center-system"]');
    expect(stars).toHaveLength(2);
    expect(stars[0]!.textContent).toContain('CENTRAR SISTEMA A');
    stars[0]!.click(); fixture.detectChanges();
    expect(focus).toHaveBeenCalledWith(snapshot.stars[0]!.id,
      productionStarFocusRadius(snapshot, snapshot.stars[0]!.id));
    root.querySelector<HTMLButtonElement>('[data-testid="system-scene-reset-view"]')!.click();
    expect(fixture.componentInstance.focusedLaboratoryStar()).toBeNull();
    expect(root.querySelector('[data-testid="system-scene"]')?.getAttribute('data-system-identity'))
      .toBe(snapshot.proceduralIdentity);
    fixture.destroy();
  }, 120_000);
});
