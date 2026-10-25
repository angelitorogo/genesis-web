import { describe, expect, it } from 'vitest';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { MULTIHOST_HISTORICAL_BRIDGE_PRE3303A2B3B as TOKEN } from
  '../../domain/stellar/stellar-multihost-historical-bridge-pre33-03a2b3b';
import { StellarMultihostHistoricalBridgePRE3303A2B3B as Bridge } from
  './stellar-multihost-historical-bridge-pre33-03a2b3b';
import { StellarV3PhysicalEpochEngine } from './stellar-v3-physical-epoch';
const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const key = new UniverseGenerationKey(seed, GeneratorVersion.V2);
const resolve = (g: bigint,s: bigint,o: bigint) =>
  Bridge.prepareOrNull(key,new SystemLocator(g,s,o),TOKEN)!;
describe('PRE33 release provenance: no silent current mass or orbital evolution',()=>{
  it('isolates the fully coeval binary and explicitly marks reference mass and spectrum',()=>{
    const v=resolve(0n,-30064771061n,0n), epoch=v.physicalEpoch;
    expect(epoch.components.map(c=>c.formationAgeGyr)).toEqual(
      [v.manifest.sharedSystemAgeGyr,v.manifest.sharedSystemAgeGyr]);
    expect(epoch.components.every(c=>c.resolvedCurrentGravityMassSolar===null)).toBe(true);
    expect(epoch.components.every(c=>c.currentBolometricLuminositySolar===null)).toBe(true);
    expect(epoch.orbits.map(o=>o.branch)).toEqual(['INNER_AB']);
    expect(epoch.orbits[0]!.resolvedCurrentSemimajorAxisAu).toBeNull();
    expect(epoch.publishable).toBe(false);
  });
  it('includes both real triple Kepler reference branches and no invented current orbit',()=>{
    const v=resolve(1n,60129542150n,1n);
    expect(v.physicalEpoch.components).toHaveLength(3);
    expect(v.physicalEpoch.orbits.map(o=>o.branch)).toEqual(['INNER_AB','OUTER_AB_C']);
    expect(v.physicalEpoch.orbits.every(o=>o.resolvedCurrentEccentricity===null)).toBe(true);
  });
  it('does not substitute reference progenitor mass for an observed WD mass',()=>{
    const v=resolve(2n,-12884901830n,0n);
    const wd=v.physicalEpoch.components.find(c=>c.evolutionState==='WHITE_DWARF');
    expect(Boolean(wd)).toBe(true);
    expect(wd!.resolvedCurrentGravityMassSolar).toBeNull();
    expect(wd!.gravityMassProvenance).toBe('UNRESOLVED_EVOLVED_MASS');
  });
  it('rejects mutation in source provenance or altered historic source identity',()=>{
    const v=resolve(0n,-30064771061n,0n);
    const corrupted={...v,manifest:{...v.manifest,gamePublicationAllowed:true as false}};
    expect(()=>StellarV3PhysicalEpochEngine.inspect(corrupted)).toThrow('INVALID_MULTIPLE_SOURCE');
  });
  it('preserves the guard against public publication and frozen V2 untouched',()=>{
    expect(GeneratorVersion.fromCodeOrNull(4)).toBeNull();
    expect(GeneratorVersion.isReleasedForNewUniverses(GeneratorVersion.V2)).toBe(true);
    const v=resolve(0n,-30064771061n,0n);
    expect(v.manifest.legacyDigestAfter).toBe(v.manifest.legacyDigestBefore);
    expect(v.physicalEpoch.presentDayHistoryCompleteness).toBe('NOT_ESTABLISHED');
    expect(v.physicalEpoch.unresolved.length).toBeGreaterThan(2);
  });
});
