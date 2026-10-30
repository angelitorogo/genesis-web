/** VIDA.6 — especies y redes ecologicas reproducibles, sin coste temporal continuo.
 * Una unica entrada de entropia (seed + identidad + revision + grupo + indice).
 * Los datos fisicos y las decisiones VIDA.3–5c son de SOLO LECTURA.
 */
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import { VIDA4_GROUPS, VIDA4_MODEL_REVISION, type Vida4EcologySnapshot,
  type Vida4Group } from '../../domain/life/procedural-ecology-vida4';
import { VIDA3_MODEL_REVISION, type Vida3MicrobialSnapshot } from '../../domain/life/procedural-microbial-vida3';
import { VIDA5C_REVISION, type Vida5cAdvancedBiosphere } from '../../domain/life/vida5c-advanced-biospheres';
import {
  vidaT1CalibrateFounder, vidaT1EligibleCivilizableSpecies, vidaT1EligibilityOf,
  vidaT1SelectFounder,
} from './vida-t1-civilized-founder';
import { VIDA6_RANDOM_NAMESPACE, VIDA6_REVISION, type Vida6BodyCovering,
  type Vida6BodyPlan, type Vida6EcosystemRegime, type Vida6EcosystemSnapshot,
  type Vida6HabitatKind, type Vida6InteractionKind, type Vida6Locomotion,
  type Vida6Nutrition, type Vida6Species, type Vida6VisualPhenotype,
  type Vida6EcologicalRelation } from '../../domain/life/vida6-ecosystems-species';

const hash = (text: string): string => bytesToHex(sha256(utf8ToBytes(text)));
function roll(key: string): number {
  const h = sha256(utf8ToBytes(key));
  return (h[0] * 0x1000000 + h[1] * 0x10000 + h[2] * 0x100 + h[3]) / 0x100000000;
}
function pick<T>(items: readonly T[], key: string): T {
  return items[Math.min(items.length - 1, Math.floor(roll(key) * items.length))];
}
const NAME_A = ['Ae','Ar','Ca','De','El','Fa','Gi','Is','Ka','Lo','Na','Or','Sa','Te','Va','Xi','Zu'] as const;
const NAME_B = ['lix','mera','thar','nia','vor','dros','luna','syl','quor','var','mira','zor'] as const;
const NAME_C = ['is','a','um','on','ia','en','or','ix','al'] as const;
const COLORS = ['#426F5B','#6E9370','#A59A65','#7B789B','#9B765F','#6388A1',
  '#C1A06E','#586F78','#B58B8B','#5E9B91','#9E8B67','#7C6A8D'] as const;
const SURFACE_HABITATS: Readonly<Record<Vida4Group, readonly Vida6HabitatKind[]>> = {
  MICROORGANISMS:['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_ROCK_SHELTER'],
  FUNGI:['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_CANOPY'],
  PLANTS_TREES:['SURFACE_SOIL','SURFACE_WET_MARGIN','SURFACE_CANOPY'],
  INSECTS:['SURFACE_SOIL','SURFACE_CANOPY','SURFACE_WET_MARGIN'],
  REPTILES:['SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER','SURFACE_WET_MARGIN'],
  BIRDS:['SURFACE_AIR','SURFACE_CANOPY','SURFACE_OPEN_TERRAIN'],
  MAMMALS:['SURFACE_SOIL','SURFACE_OPEN_TERRAIN','SURFACE_ROCK_SHELTER'],
  HUMANOIDS:['SURFACE_OPEN_TERRAIN','SURFACE_SOIL','SURFACE_ROCK_SHELTER'],
};
const BODY_PLANS: Readonly<Record<Vida4Group, Vida6BodyPlan>> = {
  MICROORGANISMS:'CELL_COLONY',FUNGI:'FILAMENTOUS',PLANTS_TREES:'STEMMED',
  INSECTS:'ARTHROPOD',REPTILES:'TETRAPOD',BIRDS:'WINGED',MAMMALS:'TETRAPOD',HUMANOIDS:'BIPED',
};
const COVERINGS: Readonly<Record<Vida4Group, Vida6BodyCovering>> = {
  MICROORGANISMS:'MEMBRANE',FUNGI:'FIBROUS',PLANTS_TREES:'FIBROUS',
  INSECTS:'CHITINOUS',REPTILES:'SCALES',BIRDS:'FEATHERS',MAMMALS:'FUR',HUMANOIDS:'LEATHERY',
};
const LENGTHS: Readonly<Record<Vida4Group, number>> = {
  MICROORGANISMS:0.00001,FUNGI:0.08,PLANTS_TREES:1.8,INSECTS:0.04,
  REPTILES:0.5,BIRDS:0.35,MAMMALS:0.7,HUMANOIDS:1.3,
};
function nutrition(group: Vida4Group, habitat: Vida6HabitatKind, key: string): Vida6Nutrition {
  if (habitat === 'AQUIFER' || habitat === 'SUBSURFACE_CAVERN' || habitat === 'PROTECTED_SEEP') {
    return group === 'FUNGI' ? 'DECOMPOSER' : 'CHEMOSYNTHETIC';
  }
  if (group === 'MICROORGANISMS') return pick(['PHOTOSYNTHETIC','CHEMOSYNTHETIC'] as const, key);
  if (group === 'FUNGI') return 'DECOMPOSER';
  if (group === 'PLANTS_TREES') return 'PHOTOSYNTHETIC';
  if (group === 'INSECTS') return pick(['HERBIVORE','MICROBIVORE','OMNIVORE'] as const, key);
  if (group === 'REPTILES' || group === 'BIRDS') return pick(['PREDATOR','OMNIVORE'] as const, key);
  if (group === 'MAMMALS') return pick(['HERBIVORE','PREDATOR','OMNIVORE'] as const, key);
  return 'OMNIVORE'; // locomocion bipeda no implica inteligencia VIDA.7
}
function traits(group: Vida4Group, habitat: Vida6HabitatKind,
  meal: Vida6Nutrition, key: string): {adaptations: readonly string[]; phenotype: Vida6VisualPhenotype} {
  const underground = ['AQUIFER','SUBSURFACE_CAVERN','PROTECTED_SEEP'].includes(habitat);
  const sessile = group === 'MICROORGANISMS' || group === 'FUNGI' || group === 'PLANTS_TREES';
  const adaptations = underground ? [
    'LOW_LIGHT', 'RESOURCE_EFFICIENCY', habitat === 'AQUIFER' ? 'WATER_COLUMN' : 'MINERAL_SUBSTRATE',
  ] : [
    meal === 'PHOTOSYNTHETIC' ? 'LIGHT_CAPTURE' : meal === 'DECOMPOSER' ? 'DETRITUS_RECYCLING' : 'RESOURCE_SEARCH',
    habitat === 'SURFACE_WET_MARGIN' ? 'MOISTURE_TOLERANCE' :
      habitat === 'SURFACE_AIR' ? 'AERIAL_STABILITY' : 'THERMAL_BUFFERING',
    (group === 'REPTILES' || group === 'INSECTS') ? 'EXTERNAL_ARMOR' : 'SENSORY_ORIENTATION',
  ];
  const mobility: Vida6Locomotion = sessile ? 'SESSILE' : group === 'BIRDS' ? 'FLYING' :
    group === 'INSECTS' ? pick(['CRAWLING','FLYING'] as const, key+'|move') : 'WALKING';
  const base = LENGTHS[group];
  const length = Number((base * (0.65 + 1.2 * roll(key+'|size'))).toPrecision(5));
  const phenotype: Vida6VisualPhenotype = Object.freeze({
    bodyPlan: BODY_PLANS[group], covering: COVERINGS[group], locomotion: mobility,
    bodyLengthMeters: length, primaryColorHex:pick(COLORS,key+'|colorA'),
    secondaryColorHex:pick(COLORS,key+'|colorB'),
    pattern: pick(['SOLID','BANDS','SPOTS','MOTTLED'] as const,key+'|pattern'),
    appendagePairs: sessile ? 0 : group === 'INSECTS' ? 3 : group === 'BIRDS' ? 2 : 2,
    bioluminescent: underground && roll(key+'|glow') < 0.35,
  });
  return {adaptations:Object.freeze(adaptations), phenotype};
}
function count(group: Vida4Group, regime: Vida6EcosystemRegime, key: string): number {
  if (regime === 'PROTECTED_MICROBIAL_SEEP') return 1 + Number(roll(key+'|count') < 0.5);
  if (regime === 'ISOLATED_SUBSURFACE') return group === 'MICROORGANISMS'
    ? 2 + Number(roll(key+'|count') < 0.5) : 1;
  const rank = VIDA4_GROUPS.indexOf(group);
  const base = regime === 'SURFACE_DIVERSE' ? 3 + Math.min(3,Math.floor(rank / 2)) : 1 + Math.floor(rank/3);
  return base + Math.floor(roll(key+'|count') * (regime === 'SURFACE_DIVERSE' ? 3 : 2));
}

export class Vida6EcosystemsSpecies {
  private constructor() {}

  static evaluate(micro: Vida3MicrobialSnapshot, ecology: Vida4EcologySnapshot,
    calibrated?: Vida5cAdvancedBiosphere): Vida6EcosystemSnapshot {
    if (micro.revision !== VIDA3_MODEL_REVISION || ecology.revision !== VIDA4_MODEL_REVISION ||
        micro.identity.generatorVersionCode !== 3 || micro.bodyStorageKey !== ecology.bodyStorageKey ||
        micro.digest !== ecology.microbialDigest ||
        micro.identity.universeSeed !== ecology.identity.universeSeed ||
        micro.identity.kind !== ecology.identity.kind ||
        micro.identity.galaxyIndex !== ecology.identity.galaxyIndex ||
        micro.habitat !== ecology.habitat) {
      throw new Error('VIDA.6 requires coherent VIDA.3b and VIDA.4a V3 sources');
    }
    if (calibrated && (calibrated.revision !== VIDA5C_REVISION ||
        micro.identity.kind !== 'PLANET' || micro.identity.universeSeed !== calibrated.identity.universeSeed ||
        micro.bodyStorageKey !== calibrated.bodyStorageKey ||
        micro.digest !== calibrated.originalMicrobialDigest ||
        ecology.digest !== calibrated.originalEcologyDigest ||
        calibrated.identity.generatorVersionCode !== 3)) {
      throw new Error('VIDA.6 rejects unrelated VIDA.5c calibrations');
    }
    const groups = calibrated?.effectiveGroups ?? ecology.groups;
    if (groups.some((g, index)=> VIDA4_GROUPS[index] !== g) ||
        (micro.habitat !== 'SURFACE_OPEN' && groups.length > (micro.habitat === 'SUBSURFACE' ? 2 : 1)) ||
        (groups.length > 0 && !micro.lifePresent && !calibrated?.effectiveMicrobialLifePresent) ||
        (groups.length === 0 && !!calibrated?.effectiveMicrobialLifePresent)) {
      throw new Error('VIDA.6 invalid biological group prefix or habitat cap');
    }
    const regime: Vida6EcosystemRegime = groups.length === 0 ? 'STERILE' :
      micro.habitat === 'SUBSURFACE' ? 'ISOLATED_SUBSURFACE' :
      micro.habitat === 'SURFACE_PROTECTED_SEEP' ? 'PROTECTED_MICROBIAL_SEEP' :
      calibrated?.advancedAtmosphereSuitable && groups.length >= 3 ? 'SURFACE_DIVERSE' : 'SURFACE_LIMITED';
    const namespace = [VIDA6_RANDOM_NAMESPACE, micro.identity.universeSeed,
      micro.identity.generatorVersionCode, micro.bodyStorageKey].join('|');
    const species: Vida6Species[] = [];
    for (const group of groups) {
      const groupKey = `${namespace}|${group}`;
      for (let i=0, n=count(group,regime,groupKey); i<n; i++) {
        const key = `${groupKey}|${i}`;
        const habitats: readonly Vida6HabitatKind[] = regime === 'ISOLATED_SUBSURFACE'
          ? ['AQUIFER','SUBSURFACE_CAVERN'] : regime === 'PROTECTED_MICROBIAL_SEEP'
            ? ['PROTECTED_SEEP'] : group === 'FUNGI' && !groups.includes('PLANTS_TREES')
              ? ['SURFACE_SOIL','SURFACE_WET_MARGIN'] : SURFACE_HABITATS[group];
        const habitat = pick(habitats,key+'|habitat');
        const meal = nutrition(group,habitat,key+'|meal');
        const detail = traits(group,habitat,meal,key);
        const name = `${pick(NAME_A,key+'|a')}${pick(NAME_B,key+'|b')} ${pick(NAME_C,key+'|c')}${String(i+1)}`;
        species.push(Object.freeze({id:`vida6:${hash(key).slice(0,24)}`,proceduralName:name,
          group,habitat,nutrition:meal,adaptations:detail.adaptations,phenotype:detail.phenotype,
          niche:`${habitat}/${meal}`}));
      }
    }
    // VIDA.T1: decide el mismo fundador que seleccionará VIDA.7 antes de sellar
    // el Ground Truth VIDA.6. No cambia la identidad, censos ni tiradas.
    const founderSelection = vidaT1EligibilityOf({
      kind: micro.identity.kind, habitat: micro.habitat, regime,
      effectiveGroups: groups, calibration: calibrated,
    }) === 'ELIGIBLE'
      ? vidaT1SelectFounder(micro.identity.universeSeed, micro.bodyStorageKey,
          vidaT1EligibleCivilizableSpecies(species))
      : null;
    const calibratedSpecies = vidaT1CalibrateFounder(species, founderSelection,
      micro.identity.universeSeed, micro.bodyStorageKey);
    if (calibratedSpecies !== species) {
      species.splice(0, species.length, ...calibratedSpecies);
    }

    const relations: Vida6EcologicalRelation[] = [];
    const byId = new Map(species.map(s => [s.id,s]));
    for (const s of species) {
      const rank = VIDA4_GROUPS.indexOf(s.group);
      const sourceKey = `${namespace}|${s.id}`;
      // Decomposition is a directed nutrient-recycling relation, not predation.
      if (s.nutrition === 'DECOMPOSER') {
        const candidate = species.filter(x=>x.id!==s.id && x.group==='MICROORGANISMS');
        if (candidate.length) relations.push(this.relation(s.id,pick(candidate,sourceKey+'|detritus').id,
          'DECOMPOSES',sourceKey+'|detritus-intensity'));
        continue;
      }
      if (s.nutrition === 'PHOTOSYNTHETIC' || s.nutrition === 'CHEMOSYNTHETIC') continue;
      // Strict lower-rank food edges prevent cycles and cannibalism.
      const food = species.filter(x => VIDA4_GROUPS.indexOf(x.group) < rank &&
        ((s.nutrition === 'HERBIVORE' && (x.group === 'PLANTS_TREES' || x.group === 'MICROORGANISMS')) ||
        (s.nutrition === 'MICROBIVORE' && x.group === 'MICROORGANISMS') ||
        (s.nutrition === 'PREDATOR' && !['FUNGI','PLANTS_TREES'].includes(x.group)) ||
        (s.nutrition === 'OMNIVORE' && x.group !== 'FUNGI')));
      if (food.length) relations.push(this.relation(s.id,pick(food,sourceKey+'|prey').id,
        'CONSUMES',sourceKey+'|prey-intensity'));
    }
    const flora = species.filter(s=>s.group==='PLANTS_TREES');
    const pollinators = species.filter(s=>s.group==='INSECTS');
    if (flora.length && pollinators.length) {
      // One explicit reciprocal ecological benefit link, not a claim of obligate pollination.
      relations.push(this.relation(pollinators[0].id,flora[0].id,'MUTUALISM',namespace+'|mutualism'));
    }
    // Competition within a shared niche is bounded and deterministic (one per group).
    for (const g of groups) {
      const eligible = species.filter(s=>s.group===g);
      const pair = eligible.find((s,i)=>eligible.some((t,j)=>j>i && s.habitat===t.habitat));
      if (pair) {
        const opponent = eligible.find(s=>s.id!==pair.id && s.habitat===pair.habitat);
        if (opponent) relations.push(this.relation(pair.id,opponent.id,'COMPETES',namespace+'|'+g+'|competition'));
      }
    }
    if (relations.some(r => r.sourceSpeciesId===r.targetSpeciesId ||
        !byId.has(r.sourceSpeciesId) || !byId.has(r.targetSpeciesId))) {
      throw new Error('VIDA.6 ecological network integrity failure');
    }
    const habitatsOccupied = Object.freeze([...new Set(species.map(s=>s.habitat))].sort());
    const source = calibrated?.digest ?? '-';
    const canonical = JSON.stringify({revision:VIDA6_REVISION,seed:micro.identity.universeSeed,
      body:micro.bodyStorageKey,microbialDigest:micro.digest,ecologyDigest:ecology.digest,
      calibrationDigest:source,regime,groups,species,relations,habitatsOccupied});
    return Object.freeze({revision:VIDA6_REVISION, identity:Object.freeze({...micro.identity}),
      bodyStorageKey:micro.bodyStorageKey,microbialRevision:micro.revision,microbialDigest:micro.digest,
      originalEcologyDigest:ecology.digest,calibrationDigest:calibrated?.digest ?? null,
      habitat:micro.habitat,regime,effectiveGroups:Object.freeze([...groups]),
      species:Object.freeze(species),relations:Object.freeze(relations),habitatsOccupied,
      biospherePresent:species.length>0,intelligentSpeciesGenerated:false as const,
      civilizationGenerated:false as const,digest:hash(canonical)});
  }

  private static relation(sourceSpeciesId:string,targetSpeciesId:string,
    kind:Vida6InteractionKind,key:string):Vida6EcologicalRelation {
    return Object.freeze({sourceSpeciesId,targetSpeciesId,kind,
      intensity01:Number((0.15+0.7*roll(key)).toFixed(4))});
  }
}
