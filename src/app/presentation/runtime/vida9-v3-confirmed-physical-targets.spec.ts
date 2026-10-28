import { afterEach, describe, expect, it, vi } from 'vitest';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { BodyLocator, SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { PlanetScientificTargetResolver, type PlanetScientificResolvedTarget } from '../../simulation/planetary/planet-scientific-target-resolver';
import { MoonScientificTargetResolver, type MoonScientificResolvedTarget } from '../../simulation/planetary/moon-scientific-target-resolver';
import { StellarMultihostFormation, type GeneratedMultipleHost, type GeneratedSingleHost } from '../../simulation/stellar/stellar-multihost-formation';
import { StellarDesignationGenerator } from '../../simulation/stellar/stellar-designation-generator';
import { StellarMultihostPublicTargetIndex } from '../../simulation/stellar/stellar-multihost-public-target-index';
import { StellarMultihostScientificTargetResolver } from '../../simulation/stellar/stellar-multihost-scientific-target-resolver';
import { vida9V3ConfirmedPhysicalTargets } from './vida9-v3-confirmed-physical-targets';

describe('VIDA.9b — background indexer public V3 sources', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reuses the generated SINGLE source, caches it and never invokes the legacy V3 resolver', () => {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
      GeneratorVersion.V3);
    const system = new SystemLocator(0n, 0n, 8n);
    const body = new BodyLocator(0n, 0n, 8n, 0n);
    const physicalPlanet = { designation: {name: 'Test A-1'} };
    const atmosphere = { hostPlanet: physicalPlanet };
    const moons = { hostPlanet: physicalPlanet };
    const host = {
      planetarySystem: { architecture: {orbitTopology:'S_TYPE'},
        planetDesignations:[{name:'Test A-1'}] },
      planets:[physicalPlanet], atmospheres:[atmosphere], moonSystems:[moons],
      physical: {}, lifetime: {},
    } as unknown as GeneratedSingleHost;
    const target = { identity:{ designation:'Test A-1' } } as unknown as PlanetScientificResolvedTarget;
    const lunarTarget = { identity:{ designation:'Test A-1 I' } } as unknown as MoonScientificResolvedTarget;
    vi.spyOn(CompactHostPlanetarySystemGenerator,'generateOrNull').mockReturnValue(null);
    vi.spyOn(StellarMultihostFormation,'generateOrNull').mockReturnValue(null);
    vi.spyOn(StellarMultihostFormation,'generateSingleOrNull').mockReturnValue(host);
    vi.spyOn(StellarDesignationGenerator,'generate').mockReturnValue(
      { name: 'Test' } as ReturnType<typeof StellarDesignationGenerator.generate>);
    const legacy = vi.spyOn(PlanetScientificTargetResolver,'resolveDetailed')
      .mockImplementation(() => { throw Error('Unsupported GeneratorVersion: 3'); });
    const project = vi.spyOn(PlanetScientificTargetResolver,'projectGenerated').mockReturnValue(target);
    const moonProject = vi.spyOn(MoonScientificTargetResolver,'resolveDetailed').mockReturnValue(lunarTarget);

    const publicSources = vida9V3ConfirmedPhysicalTargets(key,system);
    expect(publicSources?.planetCount).toBe(1);
    expect(publicSources?.resolvePlanet(body)).toBe(target);
    expect(publicSources?.resolvePlanet(body)).toBe(target);
    expect(project).toHaveBeenCalledTimes(1);
    expect(project.mock.calls[0]?.[0].locator).toBe(body);
    expect(publicSources?.resolveMoon(body,0n)).toBe(lunarTarget);
    expect(moonProject).toHaveBeenCalledTimes(1);
    expect(moonProject.mock.calls[0]?.[3]?.resolveDetailed(key,body)).toBe(target);
    expect(publicSources?.resolvePlanet(new BodyLocator(0n,0n,9n,0n))).toBeNull();
    expect(publicSources?.resolvePlanet(new BodyLocator(0n,0n,8n,1n))).toBeNull();
    expect(legacy).not.toHaveBeenCalled();
  });

  it('uses the public B/C/P ordinal of a generated MULTIHOST and never the V1 ordinal', () => {
    const key = new UniverseGenerationKey(
      UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5'),
      GeneratorVersion.V3);
    const system = new SystemLocator(0n, 1n, 7n);
    const first = new BodyLocator(0n, 1n, 7n, 0n);
    const second = new BodyLocator(0n, 1n, 7n, 1n);
    const formation = {
      parentGenerationKey:key, parentLocator:system, publicPlanets:[{},{}],
    } as unknown as GeneratedMultipleHost;
    vi.spyOn(CompactHostPlanetarySystemGenerator,'generateOrNull').mockReturnValue(null);
    vi.spyOn(StellarMultihostFormation,'generateOrNull').mockReturnValue(formation);
    const unexpectedSingle = vi.spyOn(StellarMultihostFormation,'generateSingleOrNull');
    vi.spyOn(StellarDesignationGenerator,'generate').mockReturnValue(
      {name:'Test'} as ReturnType<typeof StellarDesignationGenerator.generate>);
    vi.spyOn(StellarMultihostPublicTargetIndex,'build').mockReturnValue(
      {planets:formation.publicPlanets} as unknown as StellarMultihostPublicTargetIndex);
    const target = {identity:{designation:'Test B-1'}} as unknown as PlanetScientificResolvedTarget;
    const lunarTarget = {identity:{designation:'Test B-1 I'}} as unknown as MoonScientificResolvedTarget;
    const resolvePublic = vi.spyOn(StellarMultihostScientificTargetResolver.prototype,'resolveDetailed')
      .mockReturnValue(target);
    const resolveMoon = vi.spyOn(StellarMultihostScientificTargetResolver.prototype,'resolveMoonDetailed')
      .mockReturnValue(lunarTarget);
    const legacy = vi.spyOn(PlanetScientificTargetResolver,'resolveDetailed')
      .mockImplementation(() => {throw Error('Legacy V1 resolver invoked');});

    const physical = vida9V3ConfirmedPhysicalTargets(key,system);
    expect(physical?.planetCount).toBe(2);
    expect(physical?.resolvePlanet(second)).toBe(target);
    expect(physical?.resolvePlanet(second)).toBe(target);
    expect(resolvePublic).toHaveBeenCalledTimes(1);
    expect(resolvePublic).toHaveBeenCalledWith(key,second);
    expect(physical?.resolveMoon(first,0n)).toBe(lunarTarget);
    expect(resolveMoon).toHaveBeenCalledWith(key,first,0n);
    expect(unexpectedSingle).not.toHaveBeenCalled();
    expect(legacy).not.toHaveBeenCalled();
  });
});
