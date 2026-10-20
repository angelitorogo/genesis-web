import { ObservedHabitabilityFiche31Fe } from '../scientific/observed-habitability-fiche-31-f-e';
import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { SystemLocator } from '../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import { CompactHostPlanetarySystemGenerator } from '../../simulation/planetary/compact-host-planetary-system-generator';
import { ArchiveDiscoveryLocatorKind, type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { compactHostTypeLabel } from '../genesis-archive/archive-compact-host-card';
import { type PlanetScientificFicheResolution, PlanetScientificFicheResolutionKind } from '../planet-detail/planet-scientific-card';
import { ScientificBodyPreviewKind } from '../scientific/scientific-body-preview';
import { WorldEarthComparisonAssembler } from '../scientific/world-earth-comparison';
import { type SystemSceneSnapshot } from './system-scene-snapshot';
import { projectCompactHostScene } from './system-compact-host-scene';
import { systemScenePlanetTextureSeed } from './system-scene-planet-texture';
import { systemScenePlanetSurfaceTextureSeedV1 } from './system-scene-planet-surface-texture';
import { compactHostPlanetScientificSections } from './system-compact-host-planet-characterization-sections';
import { PLANET_FICHE_SECTION_METADATA } from '../planet-detail/planet-scientific-fiche-layout';
import { compactMoonPreview, compactMoonFiche, compactMinorFiche, compactMinorTarget } from './system-compact-host-secondary-fiches';
import { type MoonScientificFicheResolution, MoonScientificFicheResolutionKind } from '../moon-detail/moon-scientific-card';
import { type MinorBodyScientificFicheResolution, MinorBodyScientificFicheResolutionKind } from '../minor-body-detail/minor-body-scientific-card';
import { type MinorBodyScientificTargetKind } from '../../simulation/planetary/minor-body-scientific-target-resolver';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';

/** Single, address-bound read model shared by SystemScene and compact planet fiches. */
export class SystemCompactHostScientificSession {
  readonly scene: SystemSceneSnapshot;
  readonly planetCount: number;
  readonly system: CompactHostPlanetarySystem;

  private constructor(private readonly model:ArchiveDiscoveryDetailModel, system:CompactHostPlanetarySystem) {
    this.system = system;
    this.planetCount = system.planets.length;
    this.scene = projectCompactHostScene(model, model.stellarSystemCard!, model.discoveryState, system);
    if (this.scene.planets.length !== (model.discoveryState.code >= DiscoveryState.CONFIRMED.code ? this.planetCount : 0)) {
      throw new Error('Compact 3D scene and public planet identity disagree.');
    }
  }

  static buildOrNull(model:ArchiveDiscoveryDetailModel):SystemCompactHostScientificSession|null {
    if (model.generatorVersionCode !== GeneratorVersion.V2.code ||
      model.locatorKind !== ArchiveDiscoveryLocatorKind.SYSTEM ||
      model.discoveryState.code < DiscoveryState.CATALOGUED.code ||
      model.stellarSystemCard?.render.multiplicity?.name !== 'SINGLE') return null;
    const key = new UniverseGenerationKey(UniverseSeed.parse(model.universeSeed), GeneratorVersion.V2);
    const locator = new SystemLocator(model.galaxyIndex,model.sectorKey,model.galacticObjectIndex);
    const system = CompactHostPlanetarySystemGenerator.generateOrNull(key,locator);
    return system === null ? null : new SystemCompactHostScientificSession(model,system);
  }

  planetFiche(bodyIndex:bigint):PlanetScientificFicheResolution {
    if (bodyIndex < 0n || bodyIndex >= BigInt(this.planetCount)) return Object.freeze({
      kind:PlanetScientificFicheResolutionKind.NOT_FOUND,reason:'No existe un planeta compacto con ese índice público.',
    });
    if (this.model.discoveryState.code < DiscoveryState.CONFIRMED.code) return Object.freeze({
      kind:PlanetScientificFicheResolutionKind.LOCKED,
      reason:'Los planetas de sistemas compactos solo se revelan al confirmar el sistema.',
    });
    const index=Number(bodyIndex);
    const planet=this.system.planets[index]!;
    const env=this.system.environments[index]!;
    const characterization=this.system.characterizations[index]!;
    if (planet.ordinal !== index+1 || env.planetOrdinal !== planet.ordinal) throw new Error('Compact planet and environmental ordinal disagree.');
    const planetScene=this.scene.planets[index];
    if (!planetScene || planetScene.id !== `planet-${planet.ordinal}`) throw new Error('Compact scene and planet fiche refer to different bodies.');
    const title=`${this.model.stellarSystemCard!.title} ${planet.ordinal}`;
    const hostTitle=this.model.stellarSystemCard!.title;
    const textureSystemIdentity=`${this.scene.universeSeed}|v${this.scene.generatorVersionCode}|${this.scene.proceduralIdentity}`;
    const comparison=WorldEarthComparisonAssembler.build({worldLabel:title,massEarth:planet.massEarth,
      radiusEarth:planet.radiusEarth,densityGramsPerCubicCentimeter:planet.meanDensityKgM3/1000,
      surfaceGravityEarth:planet.massEarth/planet.radiusEarth**2});
    const ownMoons=this.system.secondaries.moons.filter(m=>m.parentPlanetOrdinal===planet.ordinal);
    const relevantMoons=Object.freeze(ownMoons.map(m=>Object.freeze({
      designation:`${hostTitle} ${planet.ordinal} ${moonRomanNumeralV1(m.ordinal)}`,
      moonIndex:m.ordinal-1,ordinalLabel:`Luna ${m.ordinal}`,
      fields:Object.freeze([
        Object.freeze({label:'Masa',value:`${m.massEarth.toPrecision(4)} M⊕`,note:null}),
        Object.freeze({label:'Radio',value:`${m.radiusEarth.toPrecision(4)} R⊕`,note:null}),
        Object.freeze({label:'Órbita',value:`${m.semiMajorAxisPlanetRadii.toFixed(2)} Rplaneta · ${m.orbitalPeriodDays.toFixed(2)} días`,note:null}),
        Object.freeze({label:'Escenario térmico',value:m.temperatureScenarioK===null?'No resuelto':`${m.temperatureScenarioK.toFixed(1)} K`,note:null}),
      ]),badges:Object.freeze(['Roche/Hill cribado'])})));
    const previewMoons=Object.freeze(ownMoons.map(m=>{
      const sceneMoon=this.scene.moons.find(item=>item.id===`compact-moon-${planet.ordinal}-${m.ordinal}`);
      if (!sceneMoon) throw new Error('31.4g moon identity missing from compact scene.');
      return compactMoonPreview(m,sceneMoon);
    }));
    const baseSections=compactHostPlanetScientificSections(planet,env,characterization,comparison);
    const sections=Object.freeze(baseSections.map(sec=>sec.id==='moons'?Object.freeze({...sec,
      summary:PLANET_FICHE_SECTION_METADATA.moons.summary,
      fields:Object.freeze([
        Object.freeze({label:'Satélites naturales',value:String(ownMoons.length),note:'Población modelada sin supervivencia histórica inferida.'}),
        Object.freeze({label:'Lunas con caracterización individual',value:String(ownMoons.length),note:null}),
        Object.freeze({label:'Lunas menores',value:'0',note:'La población compacta actual caracteriza individualmente todas las lunas generadas.'}),
        Object.freeze({label:'Candidatas potencialmente habitables',value:'No evaluadas',note:'El modelo no resuelve habitabilidad lunar frente al entorno compacto.'}),
        Object.freeze({label:'Candidatas de superficie',value:'No evaluadas',note:'No se ha determinado el agua, atmósfera ni exposición superficial lunar.'}),
        Object.freeze({label:'Candidatas subsuperficiales',value:'No evaluadas',note:'No se ha modelado un océano subsuperficial lunar.'}),
      ])}):sec));
    return Object.freeze({kind:PlanetScientificFicheResolutionKind.AVAILABLE,card:Object.freeze({
      title, summary:`Planeta ${planet.bulkKind==='ROCKY'?'rocoso':'supertierra'} del sistema compacto con ${compactHostTypeLabel(this.system.host.type).toLowerCase()}. Composición/geofísica simuladas y clima condicionado por la emisión compacta.`,
      hostSystemTitle:hostTitle,planetOrdinal:planet.ordinal,bodyIndex,
      orbitTopologyLabel:'Circumcompacto · sistema simple',hostPlanetCount:this.planetCount,
      accessLabel:'Consulta científica habilitada',planetaryKnowledgeLabel:'Snapshot 31.4h · geofísica simulada y clima condicionado',
      locatorLabel:`G${this.model.galaxyIndex} / S${this.model.sectorKey} / O${this.model.galacticObjectIndex} / B${bodyIndex}`,
      observedHabitability: ObservedHabitabilityFiche31Fe.unresolved('PLANET',this.model.discoveryState,true,
        `G${this.model.galaxyIndex}/S${this.model.sectorKey}/O${this.model.galacticObjectIndex}/B${bodyIndex}`) ?? undefined,
      sections:Object.freeze({sections,comparison,relevantMoons,
        relevantMoonsEmptyMessage:'No hay lunas simuladas para este planeta; no implica ausencia física.'}),
      preview:Object.freeze({kind:ScientificBodyPreviewKind.PLANET,
        accessibleLabel:`${title}: vista procedural coherente con SystemScene; las coberturas de agua/atmósfera son escenarios simulados, no observaciones.`,
        primary:Object.freeze({title,planetId:planetScene.id,radiusEarth:planet.radiusEarth,
          sourceRadiusScene:planetScene.radiusScene,baseColorHex:planetScene.colorHex,
          surfaceStyle:planetScene.surfaceStyle==='emissive'?'rocky' as const:planetScene.surfaceStyle,
          spin:planetScene.spin,surface:planetScene.surfaceEnvironment,giantAtmosphere:null,ring:null,
          equatorialScale:1,polarScale:1,albedoVisualVariantUint32:systemScenePlanetTextureSeed({
            systemIdentity:textureSystemIdentity,planetId:planetScene.id,surfaceStyle:planetScene.surfaceStyle==='emissive'?'rocky':planetScene.surfaceStyle}),
          surfaceVisualVariantUint32:systemScenePlanetSurfaceTextureSeedV1(textureSystemIdentity,planetScene.id),
          giantAtmosphereVisualVariantUint32:null}),
        moons:previewMoons,epochSimulationDay:this.scene.simulation.epochSimulationDay,
        spinPlaybackDaysPerRealSecond:this.scene.simulation.playbackDaysPerRealSecond}),
    })});
  }

  moonFiche(bodyIndex:bigint,moonIndex:bigint):MoonScientificFicheResolution {
    if (bodyIndex<0n || moonIndex<0n || bodyIndex>=BigInt(this.planetCount)) return Object.freeze({
      kind:MoonScientificFicheResolutionKind.NOT_FOUND,reason:'Índice lunar o planetario inexistente.'});
    if (this.model.discoveryState.code<DiscoveryState.CONFIRMED.code) return Object.freeze({
      kind:MoonScientificFicheResolutionKind.LOCKED,reason:'Las lunas solo se revelan al confirmar el sistema.'});
    const moon=this.system.secondaries.moons.find(m=>m.parentPlanetOrdinal===Number(bodyIndex)+1 && m.ordinal===Number(moonIndex)+1);
    if (!moon) return Object.freeze({kind:MoonScientificFicheResolutionKind.NOT_FOUND,reason:'No existe esta luna modelada.'});
    const planet=this.planetFiche(bodyIndex);
    const hostPreview=planet.kind===PlanetScientificFicheResolutionKind.AVAILABLE &&
      planet.card.preview.kind===ScientificBodyPreviewKind.PLANET ? planet.card.preview.primary : null;
    return compactMoonFiche(this.model,this.system,this.scene,moon,hostPreview);
  }

  minorFiche(kind:MinorBodyScientificTargetKind,proceduralId:string):MinorBodyScientificFicheResolution {
    if (this.model.discoveryState.code<DiscoveryState.CONFIRMED.code) return Object.freeze({
      kind:MinorBodyScientificFicheResolutionKind.LOCKED,reason:'Los cuerpos menores requieren sistema confirmado.'});
    const minor=this.system.secondaries.minorBodies.find(b=>compactMinorTarget(b,kind,proceduralId));
    return minor?compactMinorFiche(this.model,minor,this.scene):Object.freeze({
      kind:MinorBodyScientificFicheResolutionKind.NOT_FOUND,reason:'Cuerpo menor no encontrado en población compacta.'});
  }

}
