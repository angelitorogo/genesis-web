import * as THREE from 'three';
import { Vida9BiologyExploration } from '../../simulation/life/vida9-biology-exploration';
import { vida9TestSources } from '../../simulation/life/vida9-test-fixture';
import { vida38InfrastructurePlansFromConfirmed386,
  vida38InfrastructureAnchor386,vida38OrbitalInstallationsFromConfirmed386 } from './vida38-infrastructure-plan-38-6';
import { createVida38InfrastructureSurfaceVisual386 } from './vida38-infrastructure-render-38-6';

function nativeRecord(tier:'PRIMITIVE'|'ADVANCED'|'VERY_ADVANCED'='ADVANCED') {
  const source=vida9TestSources();
  const identity={...source.ecosystem.identity,kind:'PLANET' as const,moonIndex:null};
  const bodyStorageKey='0:1:2:3:PLANET:-';
  const species={id:'vida6:founder',proceduralName:'Nadara',group:'REPTILES' as const,
    habitat:'SURFACE_OPEN_TERRAIN' as const,nutrition:'OMNIVORE' as const,niche:'habitat',
    adaptations:[],phenotype:{bodyPlan:'TETRAPOD' as const,covering:'SCALES' as const,
    locomotion:'WALKING' as const,bodyLengthMeters:2,primaryColorHex:'#346475',
    secondaryColorHex:'#273849',pattern:'SOLID' as const,appendagePairs:2,bioluminescent:false}};
  const ecosystem={...source.ecosystem,identity,bodyStorageKey,
    species:[species],habitatsOccupied:['SURFACE_OPEN_TERRAIN' as const],digest:'eco-native'};
  const intelligence={...source.intelligence,identity,bodyStorageKey,
    ecosystemDigest:ecosystem.digest,digest:'civil-native',
    intelligentSpecies:{speciesId:species.id,lineage:'REPTILIAN' as const,
      communication:'VOCAL_SYMBOLIC' as const,socialStructure:'URBAN_NETWORK' as const,
      cognitionTraits:['TOOL_MANIPULATION' as const]},
    intelligencePresent:true,civilizationPresent:true,
    civilization:{founderSpeciesId:species.id,lineage:'REPTILIAN' as const,tier,
      culture:{socialOrganization:'URBAN_NETWORK' as const,governingTradition:'FEDERATED',
        communication:'VOCAL_SYMBOLIC' as const,culturalFocus:'RESEARCH'},
      technology:['MATERIAL_ENGINEERING'],
      settlementPatterns:[{id:'native-01',habitat:'SURFACE_OPEN_TERRAIN' as const,
        builtForm:tier==='PRIMITIVE'?'ROCK_TERRACE' as const:'MODULAR_CITY' as const,
        scale:tier==='VERY_ADVANCED'?'LARGE' as const:'MEDIUM' as const,
        purpose:'HABITATION' as const}]}};
  const colonization={...source.colonization,identity,bodyStorageKey,
    ecosystemDigest:ecosystem.digest,nativeCivilizationDigest:intelligence.digest,
    nativeIntelligencePresent:true,nativeCivilizationPresent:true,outcome:'NOT_SELECTED' as const};
  return Vida9BiologyExploration.evaluate(ecosystem,intelligence,colonization);
}
function colonialRecord(habitatTechnology:'SEALED_SURFACE'|'SUBSURFACE_VAULT'|'ENVIRONMENTAL_SHIELD'='SEALED_SURFACE') {
  const source=vida9TestSources();
  const origin={civilizationDigest:'origin-civil',sourceEcosystemDigest:'origin-eco',
    sourceBodyStorageKey:'0:1:2:0:PLANET:-',
    sourceIdentity:{...source.ecosystem.identity,kind:'PLANET' as const,bodyIndex:'0',moonIndex:null},
    founderSpeciesId:'origin-founder',lineage:'REPTILIAN' as const,tier:'ADVANCED' as const};
  const settlement={id:'colony-01',habitatTechnology,function:'RESEARCH' as const,
    populationBand:'OUTPOST' as const,colonialPopulationRange:[10,100] as const,
    supportSystems:['SEALED_HULL']};
  const colonization={...source.colonization,outcome:'COLONIZED' as const,
    colonies:[{id:'colony-01',origin,settlement, introducedOrganisms:[],terraform:null,
      provenance:'TECHNOLOGICAL_COLONIZATION' as const}],colonialPopulationPresent:true};
  return Vida9BiologyExploration.evaluate(source.ecosystem,source.intelligence,colonization);
}

describe('38.6 · Ground Truth->infraestructuras 3D certificadas',()=>{
  it('rechaza falta de registro, CT-0 alterado y digest manipulado',()=>{
    expect(vida38InfrastructurePlansFromConfirmed386(null)).toHaveLength(0);
    const native=nativeRecord();
    expect(vida38InfrastructurePlansFromConfirmed386({...native,digest:'INVALID'})).toHaveLength(0);
    expect(vida38InfrastructurePlansFromConfirmed386({...native,epochOffsetYears:1 as 0})).toHaveLength(0);
    expect(vida38InfrastructurePlansFromConfirmed386({...native,bodyStorageKey:'0:1:2:4:PLANET:-'})).toHaveLength(0);
  });
  it('diferencia los tres niveles nativos sin crear asentamientos que no estén registrados',()=>{
    for(const tier of ['PRIMITIVE','ADVANCED','VERY_ADVANCED'] as const){
      const native=nativeRecord(tier);
      const plans=vida38InfrastructurePlansFromConfirmed386(native);
      expect(plans).toHaveLength(1);
      expect(plans[0]!.tier).toBe(tier);
      expect(plans[0]!.provenance).toBe('VIDA7_NATIVE_SETTLEMENT');
      expect(plans[0]!.locationStatus).toBe('RECONSTRUCTED_NOT_OBSERVED');
      expect(vida38InfrastructurePlansFromConfirmed386({...native, nativeCivilizationPresent:false})).toHaveLength(0);
    }
  });
  it('reconstruye las mismas posiciones e identidades después de un roundtrip serializado',()=>{
    const native=nativeRecord();
    expect(vida38InfrastructurePlansFromConfirmed386(JSON.parse(JSON.stringify(native))))
      .toEqual(vida38InfrastructurePlansFromConfirmed386(native));
    const first=vida38InfrastructurePlansFromConfirmed386(native)[0]!;
    expect(first.latitudeRadians).toBeGreaterThan(-Math.PI/2);
    expect(first.latitudeRadians).toBeLessThan(Math.PI/2);
    expect(vida38InfrastructureAnchor386(first.seedUint32).longitudeRadians).toBe(first.longitudeRadians);
  });
  it('solo genera colonia VIDA.8 en destino, diferenciando cubierta y subsuelo',()=>{
    for(const technology of ['SEALED_SURFACE','SUBSURFACE_VAULT','ENVIRONMENTAL_SHIELD'] as const){
      const record=colonialRecord(technology);
      const plans=vida38InfrastructurePlansFromConfirmed386(record);
      expect(plans).toHaveLength(1);
      expect(plans[0]!.habitatTechnology).toBe(technology);
      expect(plans[0]!.tier).toBe('COLONIAL');
      expect(plans[0]!.provenance).toBe('VIDA8_COLONIAL_SETTLEMENT');
      const impossible={...record,colonization:{...record.colonization,outcome:'NOT_SELECTED' as const}};
      expect(vida38InfrastructurePlansFromConfirmed386(impossible)).toHaveLength(0);
    }
  });
  it('no infiere estación orbital a partir del nivel ni de una colonia',()=>{
    expect(vida38OrbitalInstallationsFromConfirmed386(nativeRecord('VERY_ADVANCED'))).toEqual([]);
    expect(vida38OrbitalInstallationsFromConfirmed386(colonialRecord())).toEqual([]);
  });
  it('InstancedMesh, anclaje superficial, LOD y liberación explícita de recursos',()=>{
    const native=vida38InfrastructurePlansFromConfirmed386(nativeRecord());
    const visual=createVida38InfrastructureSurfaceVisual386(native,1);
    expect(visual.siteCount).toBe(1);
    const [medium,high]=visual.group.children;
    expect(medium?.visible).toBe(false);
    visual.updateProjectedDiameterPixels(270);
    expect(medium?.visible).toBe(true);
    visual.updateProjectedDiameterPixels(700);
    expect(high?.visible).toBe(true);
    // InstancedMesh hereda Mesh.type ('Mesh') en Three.js. 'type' no
    // identifica de forma fiable la subclase; inspeccionamos el árbol real.
    const instancedMeshes: THREE.InstancedMesh[] = [];
    high!.traverse(object => {
      if (object instanceof THREE.InstancedMesh) instancedMeshes.push(object);
    });
    expect(instancedMeshes.length).toBeGreaterThan(0);
    for (const instanced of instancedMeshes) {
      expect(instanced.count).toBeGreaterThan(0);
      const matrix = new THREE.Matrix4();
      instanced.getMatrixAt(0, matrix);
      expect(matrix.elements.every(Number.isFinite)).toBe(true);
    }
    const site=high!.children[0]!;
    expect(site.position.length()).toBeGreaterThan(1);
    expect(site.position.length()).toBeLessThan(1.01);
    expect(visual.resources.length).toBeGreaterThan(4);
    visual.resources.forEach(resource=>resource.dispose());
  });
});

describe('38.6 · frontera de presentación en SystemScene',()=>{
  it('no transfiere una colonia lunar a un planeta y respeta los bindings científicos',async()=>{
    const {civilizationVisualMapOf,decorateSystemSceneSnapshotWithCivilizationTiers} =
      await import('../system/system-scene-civilization-visuals');
    const {ArchiveStellarSystemKnowledgeLevel} =
      await import('../genesis-archive/archive-stellar-system-card');
    const colony=vida38InfrastructurePlansFromConfirmed386(colonialRecord());
    const planet=vida38InfrastructurePlansFromConfirmed386(nativeRecord());
    const base={
      universeSeed: '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
      generatorVersionCode:3,
      address:{galaxyIndex:0n,sectorKey:1n,galacticObjectIndex:2n},
      knowledgeLevel:ArchiveStellarSystemKnowledgeLevel.CONFIRMED,
      stars:[],planets:[{id:'planet-alpha',visualCivilizationTier:null}],
      moons:[{id:'moon-beta',hostPlanetId:'planet-alpha'}],
      scientificPlanetBindings:[{sceneBodyId:'planet-alpha',bodyIndex:'3'}],
      scientificMoonBindings:[{sceneBodyId:'moon-beta',bodyIndex:'3',moonIndex:'0'}],
    } as unknown as import('../system/system-scene-snapshot').SystemSceneSnapshot;
    const map=civilizationVisualMapOf([
      {bodyIndex:'3',tier:'ADVANCED',infrastructurePlans:planet},
      {bodyIndex:'3',moonIndex:'0',tier:null,infrastructurePlans:colony},
    ]);
    const rendered=decorateSystemSceneSnapshotWithCivilizationTiers(base,map);
    expect(rendered.planets[0]?.visualInfrastructurePlans).toBe(planet);
    expect(rendered.moons[0]?.visualInfrastructurePlans).toBe(colony);
    const unknown={...base,knowledgeLevel:ArchiveStellarSystemKnowledgeLevel.CATALOGUED};
    expect(decorateSystemSceneSnapshotWithCivilizationTiers(unknown,map)).toBe(unknown);
    const moved={...base,universeSeed:'OTRO-UNIVERSO'};
    const bound=civilizationVisualMapOf([{bodyIndex:'3',tier:'ADVANCED',infrastructurePlans:planet,
      universeSeed:base.universeSeed, generatorVersionCode:3,systemKey:'0/1/2'}]);
    expect(decorateSystemSceneSnapshotWithCivilizationTiers(moved,bound).planets[0]?.visualInfrastructurePlans)
      .toBeUndefined();
  });
});
