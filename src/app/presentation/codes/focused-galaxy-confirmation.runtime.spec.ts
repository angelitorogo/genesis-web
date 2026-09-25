import {
  DiscoveryState,
  type DiscoveryStateValue,
} from '../../domain/discovery/discovery-state';
import {
  GalaxyLocator,
  GalacticObjectLocator,
  SectorLocator,
  SystemLocator,
  type ProceduralLocator,
} from '../../domain/generation/procedural-locator';
import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';
import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';
import {
  type DiscoveryRepository,
  type UniverseNavigationRepository,
} from '../../domain/repository/genesis-repositories';
import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';
import {
  CONFIRM_FOCUSED_GALAXY_CODE,
  FocusedGalaxyConfirmationRuntime,
  type FocusedGalaxyConfirmationPlanFactory,
} from './focused-galaxy-confirmation.runtime';

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      'C0DE-6A1A-0000-0000-0000-0000-0000-0001',
    ),
    GeneratorVersion.V2,
  );

const otherKey =
  new UniverseGenerationKey(
    key.universeSeed.copy(),
    GeneratorVersion.V1,
  );

function locatorKey(locator: ProceduralLocator): string {
  if (locator instanceof GalaxyLocator) return `G:${locator.galaxyIndex}`;
  if (locator instanceof SectorLocator) return `S:${locator.galaxyIndex}:${locator.sectorKey}`;
  if (locator instanceof SystemLocator) return `Y:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  if (locator instanceof GalacticObjectLocator) return `O:${locator.galaxyIndex}:${locator.sectorKey}:${locator.galacticObjectIndex}`;
  return JSON.stringify(locator);
}

describe('FocusedGalaxyConfirmationRuntime', () => {
  it('usa un código hexadecimal estable para QA', () => {
    expect(CONFIRM_FOCUSED_GALAXY_CODE).toBe('C0DE-6A1A-C0DE-F11A');
    expect(CONFIRM_FOCUSED_GALAXY_CODE).toMatch(/^[0-9A-F]{4}(?:-[0-9A-F]{4}){3}$/);
  });

  it('confirma únicamente la galaxia activa y todos sus sectores/sistemas/objetos sin tocar otra galaxia', async () => {
    const states = new Map<string, DiscoveryStateValue>();
    states.set('G:7', DiscoveryState.DISCOVERED);
    states.set('G:9', DiscoveryState.DISCOVERED);

    const navigation: UniverseNavigationRepository = {
      async getNavigation() {
        return { activeGalaxyIndex: 7n, recentGalaxyIndices: [9n] };
      },
      async setNavigation() {
        throw new Error('The QA confirmation must not change focus.');
      },
    };

    const discovery: DiscoveryRepository = {
      async getState(_generationKey, locator) {
        return states.get(locatorKey(locator)) ?? DiscoveryState.UNKNOWN;
      },
      async setState(_generationKey, locator, state) {
        states.set(locatorKey(locator), state);
      },
      async getKnownDiscoveries() { return []; },
      async getKnownDiscoveriesInSector() { return []; },
    };

    const plan: FocusedGalaxyConfirmationPlanFactory = (_generationKey, galaxyIndex) => {
      expect(galaxyIndex).toBe(7n);
      return {
        totalSectors: 2n,
        sectors: [
          {
            sectorLocator: new SectorLocator(7n, 10n),
            systemLocators: [new SystemLocator(7n, 10n, 0n), new SystemLocator(7n, 10n, 1n)],
            galacticObjectLocators: [new GalacticObjectLocator(7n, 10n, 0n)],
          },
          {
            sectorLocator: new SectorLocator(7n, 11n),
            systemLocators: [],
            galacticObjectLocators: [new GalacticObjectLocator(7n, 11n, 0n)],
          },
        ],
      };
    };

    const runtime = new FocusedGalaxyConfirmationRuntime(navigation, discovery, plan);
    await expect(runtime.confirmFocusedGalaxy(key)).resolves.toEqual({
      kind: 'confirmed', galaxyIndex: 7n, sectors: 2n, systems: 2n, galacticObjects: 2n,
    });

    expect(states.get('G:7')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('S:7:10')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('S:7:11')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('Y:7:10:0')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('Y:7:10:1')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('O:7:10:0')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('O:7:11:0')).toBe(DiscoveryState.CONFIRMED);
    expect(states.get('G:9')).toBe(DiscoveryState.DISCOVERED);
  });

  it('no materializa una galaxia que no esté conocida como foco y no funciona en V1', async () => {
    let planned = false;
    const navigation: UniverseNavigationRepository = {
      async getNavigation() { return { activeGalaxyIndex: 4n, recentGalaxyIndices: [] }; },
      async setNavigation() {},
    };
    const discovery: DiscoveryRepository = {
      async getState() { return DiscoveryState.UNKNOWN; },
      async setState() { throw new Error('No write expected.'); },
      async getKnownDiscoveries() { return []; },
      async getKnownDiscoveriesInSector() { return []; },
    };
    const plan: FocusedGalaxyConfirmationPlanFactory = () => {
      planned = true;
      return { totalSectors: 0n, sectors: [] };
    };
    const runtime = new FocusedGalaxyConfirmationRuntime(navigation, discovery, plan);

    await expect(runtime.confirmFocusedGalaxy(key)).resolves.toEqual({ kind: 'no-focused-galaxy' });
    expect(planned).toBe(false);
    await expect(runtime.confirmFocusedGalaxy(otherKey)).resolves.toEqual({ kind: 'unsupported-version' });
    expect(planned).toBe(false);
  });
});
