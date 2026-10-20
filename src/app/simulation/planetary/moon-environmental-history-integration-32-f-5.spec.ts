import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator } from '../../domain/generation/procedural-locator';
import { PlanetScientificTargetResolver } from './planet-scientific-target-resolver';
import { MoonScientificTargetResolver } from './moon-scientific-target-resolver';
import { PlanetaryHistoricalRuntime31Fi1 } from '../planetary-history/planetary-historical-runtime-31-f-i-1';
import { MoonScientificSectionsAssembler } from '../../presentation/moon-detail/moon-scientific-sections';

describe('32.F.5 — integración real con mundos V2 materializados', () => {
  it('reutiliza la edad y fuentes históricas del mismo host sin regenerar lunas ni CT-0', () => {
    const source = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
      GeneratorVersion.V1);
    const locator = new BodyLocator(3n, -17n, 8n, 2n);
    const planet = PlanetScientificTargetResolver.resolveDetailed(source, locator);
    expect(planet).not.toBeNull();
    const lunar = planet!.detail.moons.relevantMoons;
    expect(lunar.length).toBeGreaterThan(0);
    const sourceMoon = lunar[0];
    const history = PlanetaryHistoricalRuntime31Fi1.moonEnvironmentalHistory32F5(
      planet!, sourceMoon.moonOrdinal);
    expect(history).not.toBeNull();
    expect(history?.bodyKey).toBe('G3/S-17/O8/B2/M0');
    expect(history?.hostPlanetOrdinal).toBe(sourceMoon.moonOrdinal > 0 ? planet!.identity.planetOrdinal : -1);
    const moon = MoonScientificTargetResolver.resolveDetailed(source, locator, BigInt(sourceMoon.moonIndex));
    expect(moon).not.toBeNull();
    const originalOcean = sourceMoon.oceanReality32F2c;
    expect(moon?.detail.environment.oceanReality32F2c).toEqual(originalOcean);
    expect(moon?.detail.environment.environmentalHistory32F5?.ageYearsCT0)
      .toBe(history?.ageYearsCT0);
    const view = MoonScientificSectionsAssembler.build(moon!);
    expect(view.sections.map(section => section.id)).toContain('history');
    expect(view.sections.find(section => section.id === 'history')?.eyebrow).toBe('SECCIÓN 08');
    expect(view.sections.find(section => section.id === 'habitability')?.eyebrow).toBe('SECCIÓN 09');
    expect(history?.historicalHabitability).toBe('UNKNOWN');
    expect(history?.historicalOceanContinuity).toBe('UNKNOWN');
  }, 60_000);
});
