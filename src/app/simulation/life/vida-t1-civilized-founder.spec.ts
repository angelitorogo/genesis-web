import { describe, expect, it } from 'vitest';
import { VIDA4_GROUPS } from '../../domain/life/procedural-ecology-vida4';
import { VIDA3_MODEL_REVISION, type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA5_ATMOSPHERE_REVISION, type Vida5AtmosphericFeedback } from '../../domain/life/vida5-biogenic-atmosphere';
import { VIDA5C_REVISION, type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import { Vida6EcosystemsSpecies } from './vida6-ecosystems-species';
import { Vida7IntelligenceCivilizations } from './vida7-intelligence-civilizations';
import { ProceduralEcologyVIDA4 } from './procedural-ecology-vida4';
import {
  VIDA_T1_MIN_CIVILIZED_BODY_LENGTH_METERS,
  vidaT1CalibrateFounder,
  vidaT1SelectFounder,
  vidaT1EligibleCivilizableSpecies,
} from './vida-t1-civilized-founder';

const seed = '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5';
const feedback: Vida5AtmosphericFeedback = {
  revision: VIDA5_ATMOSPHERE_REVISION, status:'APPLIED', ecologyDigest:'synthetic',
  sourcePressurePascal:101325,pressurePascal:101325,sourceOxygenFraction01:0.03,
  oxygenFraction01:0.21,oxygenPartialPressurePascal:21278,aerobicAdvanced:true,
  effectiveGroups:VIDA4_GROUPS,stablePhotosyntheticVegetation:true,
  advancedAerobicFaunaSupported:true,nativeCivilizationAtmosphereReady:true,
  gasComposition:[{gas:'NITROGEN',moleFraction01:0.79},{gas:'OXYGEN',moleFraction01:0.21}],
  meanMolarMassGramsPerMole:28.9,referenceDensityKilogramsPerCubicMeter:1.2,
  greenhouseTrappingFraction01:0.35,climateDeltaKelvin:0,meanSurfaceTemperatureKelvin:290,
  pressureBalanceFactor:1,digest:'atmosphere',
};
function sources(n: number) {
  const identity: Vida3MicrobialSnapshot['identity'] = {
    universeSeed:seed,generatorVersionCode:3,kind:'PLANET',galaxyIndex:'0',
    sectorKey:'1',galacticObjectIndex:'2',bodyIndex:String(n),moonIndex:null,
  };
  const micro: Vida3MicrobialSnapshot = {
    revision:VIDA3_MODEL_REVISION,identity,
    bodyStorageKey:`0:1:2:${n}:PLANET:-`, plausibility:'PLAUSIBLE',
    selectedRoute:'SURFACE',habitat:'SURFACE_OPEN',lifePresent:true,biology:'MICROBIAL',
    biosphereId:'vida3:synthetic',digest:String(n+1).padStart(64,'a'),
  };
  const ecology = ProceduralEcologyVIDA4.evaluate(micro);
  const calibration: Vida5cAdvancedBiosphere = {
    revision:VIDA5C_REVISION,
    identity:{universeSeed:seed,generatorVersionCode:3,galaxyIndex:'0'},
    bodyStorageKey:micro.bodyStorageKey,originalMicrobialDigest:micro.digest,
    originalEcologyDigest:ecology.digest,originalMaturationDigest:'mature',
    originalMicrobialLifePresent:true,effectiveMicrobialLifePresent:true,
    newlyEstablishedMicrobialLife:false,originalEffectiveGroups:ecology.groups,
    effectiveGroups:VIDA4_GROUPS,promotedFromPhysicalEvidence:true,
    advancedAtmosphereSuitable:true,atmosphericFeedback:feedback,
    nativeCivilizationPrerequisitesReady:true,
    futureIntelligenceProbability:0.65,futureCivilizationConditionalProbability:0.60,
    digest:`calibration-${n}`,
  };
  return {micro,ecology,calibration};
}

describe('VIDA.T1 — mínimo morfológico del fundador civilizado', () => {
  it('respeta 1,50 m para los tres niveles y los tres linajes sin cambiar identidades', () => {
    const tiers = new Set<string>();
    const lineages = new Set<string>();
    let civilized = 0;
    let onlyIntelligent = 0;
    for (let i=0;i<420;i++) {
      const {micro,ecology,calibration} = sources(i);
      const ecosystem = Vida6EcosystemsSpecies.evaluate(micro,ecology,calibration);
      const intelligence = Vida7IntelligenceCivilizations.evaluate(ecosystem,calibration);
      const legacyMorphology = Vida6EcosystemsSpecies.evaluate(micro,ecology,{
        ...calibration,nativeCivilizationPrerequisitesReady:false,
      });
      expect(ecosystem.species.map(species=>species.id))
        .toEqual(legacyMorphology.species.map(species=>species.id));
      if (intelligence.civilization) {
        civilized++;
        tiers.add(intelligence.civilization.tier);
        lineages.add(intelligence.civilization.lineage);
        const founderId = intelligence.civilization.founderSpeciesId;
        const founder = ecosystem.species.find(species=>species.id===founderId)!;
        expect(founder).toBeDefined();
        expect(founder.phenotype.bodyLengthMeters)
          .toBeGreaterThanOrEqual(VIDA_T1_MIN_CIVILIZED_BODY_LENGTH_METERS);
        if (founder.group==='INSECTS') expect(founder.phenotype.locomotion).not.toBe('FLYING');
        expect(founder.adaptations).toContain('MACROSCOPIC_TOOL_MANIPULATION');
        for (let j=0;j<ecosystem.species.length;j++) {
          if (ecosystem.species[j]!.id!==founderId) {
            expect(ecosystem.species[j]).toEqual(legacyMorphology.species[j]);
          }
        }
      } else if (intelligence.intelligentSpecies) {
        onlyIntelligent++;
        expect(ecosystem.species).toEqual(legacyMorphology.species);
      } else {
        expect(ecosystem.species).toEqual(legacyMorphology.species);
      }
      expect(Vida6EcosystemsSpecies.evaluate(micro,ecology,calibration)).toEqual(ecosystem);
      expect(Vida7IntelligenceCivilizations.evaluate(ecosystem,calibration)).toEqual(intelligence);
    }
    expect(civilized).toBeGreaterThan(40);
    expect(onlyIntelligent).toBeGreaterThan(20);
    expect(tiers).toEqual(new Set(['PRIMITIVE','ADVANCED','VERY_ADVANCED']));
    expect(lineages).toEqual(new Set(['HUMANOID','REPTILIAN','INSECTOID']));
  }, 15000);

  it('no aumenta animales por simple inteligencia cuando no hay civilización', () => {
    const candidate = sources(23);
    const base = Vida6EcosystemsSpecies.evaluate(candidate.micro,candidate.ecology,{
      ...candidate.calibration,nativeCivilizationPrerequisitesReady:false,
    });
    const eligible = vidaT1EligibleCivilizableSpecies(base.species);
    const intelligent = vidaT1SelectFounder(seed,base.bodyStorageKey,eligible);
    const noCivilization = intelligent === null ? null : {...intelligent,civilizationTier:null};
    expect(vidaT1CalibrateFounder(base.species,noCivilization,seed,base.bodyStorageKey))
      .toBe(base.species);
    expect(base.species).toEqual(Vida6EcosystemsSpecies.evaluate(candidate.micro,
      candidate.ecology,{...candidate.calibration,nativeCivilizationPrerequisitesReady:false}).species);
  });
});
