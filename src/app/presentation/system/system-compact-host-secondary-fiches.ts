import { type CompactHostMoon, type CompactHostMinorBody } from '../../domain/planetary/compact-host-secondary-population';
import { MinorBodyKind } from '../../domain/planetary/minor-body-kind';
import { buildSystemSceneTnoPresentationV1 } from './system-scene-tno-presentation';
import { buildSystemSceneCapturedPresentationV1 } from './system-scene-captured-presentation';
import { moonRomanNumeralV1 } from '../../domain/planetary/moon-designation';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { type SystemSceneSnapshot, type SystemSceneMoonSnapshot } from './system-scene-snapshot';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { WorldEarthComparisonAssembler } from '../scientific/world-earth-comparison';
import { ScientificBodyPreviewKind, type ScientificMoonPreviewVisual, type ScientificPlanetPreviewVisual } from '../scientific/scientific-body-preview';
import { MoonScientificFicheResolutionKind, type MoonScientificFicheResolution } from '../moon-detail/moon-scientific-card';
import { MinorBodyScientificFicheResolutionKind, type MinorBodyScientificFicheResolution } from '../minor-body-detail/minor-body-scientific-card';
import { type MinorBodyScientificTargetKind } from '../../simulation/planetary/minor-body-scientific-target-resolver';
import {
  buildSystemSceneCometPresentationV1,
  systemSceneCometActivityAtDistanceV1,
} from './system-scene-comet-presentation';
import {
  isCometActivityUnresolvedInSceneV1,
  systemSceneCometActivityVisualParityV1,
} from './system-scene-comet-activity-parity';

const format=(n:number)=>n.toLocaleString('es-ES',{maximumSignificantDigits:5});
const field=(label:string,value:string,note:string|null=null)=>Object.freeze({label,value,note});
const section=<Id extends string>(id:Id,title:string,summary:string,fields:ReturnType<typeof field>[])=>
  Object.freeze({id,eyebrow:'SNAPSHOT · 31.4g',title,summary,fields:Object.freeze(fields)});

const MIN_COMET_REFERENCE_LUMINOSITY_SOLAR = 1e-6;

function fallbackCompactCometPresentation(body: CompactHostMinorBody) {
  return buildSystemSceneCometPresentationV1({
    proceduralId: body.proceduralId,
    diameterKilometers: body.diameterKilometers,
    iceFraction01: body.iceFraction01,
    dustFraction01: 1 - body.iceFraction01,
    porosityIndex01: 0.42,
    bulkDensityGramsPerCubicCentimeter: body.bulkDensityGramsCm3,
    geometricAlbedo01: body.geometricAlbedo01,
    volatileRichnessIndex01: body.iceFraction01,
    periodRegime: 'LONG_PERIOD',
    referenceLuminositySolar: MIN_COMET_REFERENCE_LUMINOSITY_SOLAR,
    semiMajorAxisAu: body.semiMajorAxisAu,
    eccentricity: body.eccentricity,
    periapsisAu: body.periapsisAu,
    apoapsisAu: body.apoapsisAu,
    orbitalPeriodYears: body.orbitalPeriodDays / 365.25,
    epochMeanAnomalyDegrees: body.ordinal * 47,
    presentationTimeScale: 1,
  });
}

export function compactMoonPreview(moon:CompactHostMoon,sceneMoon:SystemSceneMoonSnapshot):ScientificMoonPreviewVisual {
  const visual=sceneMoon.visualPresentation;
  const orbit = Object.freeze({semiMajorAxisPlanetRadii:moon.semiMajorAxisPlanetRadii,
    eccentricity:moon.eccentricity,inclinationDegrees:moon.inclinationDegrees,
    rotationDegrees:sceneMoon.spin.epochPhaseDegrees,
    epochMeanAnomalyDegrees:moon.ordinal*61,
    orbitalPeriodDays:moon.orbitalPeriodDays,
    periapsisPlanetRadii:moon.semiMajorAxisPlanetRadii*(1-moon.eccentricity),
    apoapsisPlanetRadii:moon.semiMajorAxisPlanetRadii*(1+moon.eccentricity)});
  return Object.freeze({title:sceneMoon.title,moonOrdinal:moon.ordinal,
    semiMajorAxisPlanetRadii:moon.semiMajorAxisPlanetRadii,orbit,
    sourceRadiusScene:sceneMoon.radiusScene,spin:sceneMoon.spin,
    radiusEarth:moon.radiusEarth,shapeClass:visual.shapeClass,surfaceStyle:visual.surfaceStyle,
    presentationRadiusScene:visual.presentationRadiusScene,
    presentationIrregularity01:visual.presentationIrregularity01,
    presentationLiquidCoverage01:visual.presentationLiquidCoverage01,
    presentationIceCoverage01:visual.presentationIceCoverage01,
    presentationVolcanicCoverage01:visual.presentationVolcanicCoverage01,
    presentationCloudCoverage01:visual.presentationCloudCoverage01,
    presentationAtmospherePresent:visual.presentationAtmospherePresent,
    presentationAtmosphereStrength01:visual.presentationAtmosphereStrength01,
    presentationAtmosphereShellScale:visual.presentationAtmosphereShellScale,
    presentationBaseColorHex:visual.presentationBaseColorHex,
    presentationAccentColorHex:visual.presentationAccentColorHex,
    presentationAtmosphereColorHex:visual.presentationAtmosphereColorHex,
    visualVariantUint32:visual.presentationSeedUint32});
}

export function compactMoonFiche(model:ArchiveDiscoveryDetailModel,system:CompactHostPlanetarySystem,
  scene:SystemSceneSnapshot,moon:CompactHostMoon,hostPlanetPreview:ScientificPlanetPreviewVisual|null):MoonScientificFicheResolution {
  const cardTitle=model.stellarSystemCard!.title;
  const bodyIndex=moon.parentPlanetOrdinal-1;
  const sceneMoon=scene.moons.find(m=>m.id===`compact-moon-${moon.parentPlanetOrdinal}-${moon.ordinal}`);
  if (!sceneMoon) throw new Error('Missing compact moon scene correspondence.');
  const title=`${cardTitle} ${moon.parentPlanetOrdinal} ${moonRomanNumeralV1(moon.ordinal)}`;
  const comparison=WorldEarthComparisonAssembler.build({worldLabel:title,massEarth:moon.massEarth,
    radiusEarth:moon.radiusEarth,densityGramsPerCubicCentimeter:moon.densityGramsCm3,
    surfaceGravityEarth:moon.massEarth/moon.radiusEarth**2});
  const sections=Object.freeze([
    section('general','General','Satélite rocoso/helado simulado; composición y masa de referencia.',[
      field('Masa',`${format(moon.massEarth)} M⊕`),field('Radio',`${format(moon.radiusEarth)} R⊕`),
      field('Densidad',`${format(moon.densityGramsCm3)} g/cm³`),
      field('Gravedad',`${format(moon.massEarth/moon.radiusEarth**2)} g⊕`)]),
    section('orbit','Órbita','Screen Roche y fracción estable de Hill, no integración N-body.',[
      field('Semieje mayor',`${format(moon.semiMajorAxisPlanetRadii)} radios planetarios`),
      field('Excentricidad',format(moon.eccentricity)),
      field('Inclinación',`${format(moon.inclinationDegrees)}°`),
      field('Periodo',`${format(moon.orbitalPeriodDays)} días`),
      field('Límite Roche',`${format(moon.rocheLimitAu)} UA`),
      field('Límite 40 % Hill',`${format(moon.hillLimitAu*0.4)} UA`)]),
    section('tides','Mareas','Rotación síncrona de referencia, no historia evolutiva.',[
      field('Acoplamiento','Síncrono (supuesto de presentación)'),
      field('Calentamiento de marea (proxy)',`${format(moon.tidalHeatingIndex01)} / 1`)]),
    section('environment','Entorno','Escenario condicionado, sin inventario atmosférico validado.',[
      field('Hielo (índice de referencia)',`${format(moon.iceRichnessIndex01)} / 1`),
      field('Temperatura radiativa escenario',moon.temperatureScenarioK===null?'No resuelta':`${format(moon.temperatureScenarioK)} K`),
      field('Atmósfera','No determinada'),field('Protección energética','No cuantificada')]),
    section('habitability','Habitabilidad','No se infiere habitabilidad a partir de proxies sin agua ni radiación caracterizadas.',[
      field('Candidatura','No evaluada'),field('Océano subsuperficial','No evaluado')]),
    section('comparison','Comparación con la Tierra','Magnitudes físicas del snapshot.',[
      field('Masa relativa',`${format(moon.massEarth)} M⊕`),field('Radio relativo',`${format(moon.radiusEarth)} R⊕`),
      field('Densidad relativa',`${format(comparison.densityEarth)} ρ⊕`),
      field('Gravedad relativa',`${format(comparison.surfaceGravityEarth)} g⊕`)]),
  ]);
  return Object.freeze({kind:MoonScientificFicheResolutionKind.AVAILABLE,card:Object.freeze({
    title,summary:'Luna modelada de un planeta con anfitrión compacto; evaluación Roche/Hill sin evolución histórica.',
    hostPlanetTitle:`${cardTitle} ${moon.parentPlanetOrdinal}`,hostSystemTitle:cardTitle,
    moonOrdinal:moon.ordinal,
    hostMoonCount:system.secondaries.moons.filter(m=>m.parentPlanetOrdinal===moon.parentPlanetOrdinal).length,
    accessLabel:'Consulta científica habilitada',knowledgeLabel:'Snapshot secundario 31.4g · estabilidad N-body no resuelta',
    locatorLabel:`G${model.galaxyIndex} / S${model.sectorKey} / O${model.galacticObjectIndex} / B${bodyIndex} / M${moon.ordinal-1}`,
    sections:Object.freeze({sections,comparison,badges:Object.freeze(['Roche/Hill cribado','Geofísica condicionada'])}),
    preview:Object.freeze({kind:ScientificBodyPreviewKind.MOON,
      accessibleLabel:`${title}: inspección procedural de luna en órbita de planeta compacto.`,
      primary:compactMoonPreview(moon,sceneMoon),hostPlanet:hostPlanetPreview,
      moons:Object.freeze([]),epochSimulationDay:scene.simulation.epochSimulationDay,
      spinPlaybackDaysPerRealSecond:scene.simulation.playbackDaysPerRealSecond}),
  })});
}

export function compactMinorFiche(model:ArchiveDiscoveryDetailModel,body:CompactHostMinorBody,scene:SystemSceneSnapshot):MinorBodyScientificFicheResolution {
  const systemName=model.stellarSystemCard!.title;
  const kindLabel=body.kind===MinorBodyKind.ASTEROID?'Asteroide':body.kind===MinorBodyKind.COMET?'Cometa':
    body.kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT?'Objeto distante (análogo TNO)':'Candidato capturado';
  const title=`${systemName} · ${kindLabel} ${body.ordinal}`;
  const sections=Object.freeze([
    section('general','General','Población menor intrínseca simulada en un anfitrión compacto.',[
      field('Clase',kindLabel),field('Diámetro',`${format(body.diameterKilometers)} km`),
      field('Densidad',`${format(body.bulkDensityGramsCm3)} g/cm³`),
      field('Hielo (fracción modelada)',`${format(body.iceFraction01*100)} %`),
      field('Albedo geométrico',format(body.geometricAlbedo01))]),
    section('orbit','Órbita','Órbita vinculada al anfitrión compacto, sin N-body.',[
      field('Semieje mayor',`${format(body.semiMajorAxisAu)} UA`),
      field('Excentricidad',format(body.eccentricity)),
      field('Periastro',`${format(body.periapsisAu)} UA`),
      field('Apoastro',`${format(body.apoapsisAu)} UA`),
      field('Período',`${format(body.orbitalPeriodDays)} días`),
      field('Inclinación',`${format(body.inclinationDegrees)}°`)]),
    section('environment','Entorno','El origen histórico, actividad cometaria y exposición energética no están reconstruidos.',[
      field('Actividad física','No resuelta sin espectro o transferencia radiativa completa'),
      field('Historia de captura/supernova','No modelada'),
      field('Estabilidad','Criba sin integración N-body')]),
  ]);
  const scientificKind=body.kind===MinorBodyKind.ASTEROID?ScientificBodyPreviewKind.ASTEROID:
    body.kind===MinorBodyKind.COMET?ScientificBodyPreviewKind.COMET:
      body.kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT?ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT:
      ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT;
  const source=scene.minorBodies.find(b=>b.id.endsWith(body.proceduralId)&&b.minorBodyKind===body.kind);
  const a=source?.asteroidPresentation;
  const comet=source?.cometPresentation ?? (body.kind===MinorBodyKind.COMET
    ? fallbackCompactCometPresentation(body)
    : null);
  const tno=body.kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT
    ? (source?.tnoPresentation ?? buildSystemSceneTnoPresentationV1({
        proceduralId:body.proceduralId,diameterKilometers:body.diameterKilometers,
        iceFraction01:body.iceFraction01,rockFraction01:1-body.iceFraction01,
        geometricAlbedo01:body.geometricAlbedo01,
        bulkDensityGramsPerCubicCentimeter:body.bulkDensityGramsCm3,
      })) : null;
  const captured=body.kind===MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT
    ? (source?.capturedPresentation ?? buildSystemSceneCapturedPresentationV1({
        proceduralId:body.proceduralId,diameterKilometers:body.diameterKilometers,
        volatileFraction01:body.iceFraction01,refractoryFraction01:1-body.iceFraction01,
        geometricAlbedo01:body.geometricAlbedo01,
        bulkDensityGramsPerCubicCentimeter:body.bulkDensityGramsCm3,
        porosityIndex01:0.34,compositionRegime:body.iceFraction01>0.6?'VOLATILE_RICH':body.iceFraction01<0.3?'ROCK_DOMINATED':'MIXED',
      })) : null;
  // A neutral preview is used only where radiation-dependent presentation is
  // legitimately unavailable (notably an unilluminated BH comet).
  const preview:import('../scientific/scientific-body-preview').ScientificBodyPreviewModel =
    scientificKind===ScientificBodyPreviewKind.ASTEROID && a ? Object.freeze({
      kind:ScientificBodyPreviewKind.ASTEROID,title,accessibleLabel:`${title}: forma procedural de la escena 3D`,
      primary:Object.freeze({version:1 as const,
        compositionRegime:a.compositionRegime,structureRegime:a.structureRegime,
        multiplicityRegime:a.multiplicityRegime,visualVariantUint32:a.shapeSeedUint32,
        presentationColorHex:a.presentationColorHex,presentationRoughness01:a.presentationRoughness01,
        presentationMetalness01:a.presentationMetalness01,presentationIrregularity01:a.presentationIrregularity01,
        presentationFacetContrast01:a.presentationFacetContrast01,
        presentationAxisScaleX:a.presentationAxisScaleX,presentationAxisScaleY:a.presentationAxisScaleY,
        presentationAxisScaleZ:a.presentationAxisScaleZ,
        presentationOrientationXRadians:a.presentationOrientationXRadians,
        presentationOrientationYRadians:a.presentationOrientationYRadians,
        presentationOrientationZRadians:a.presentationOrientationZRadians,
        presentationContactSecondaryRadiusScale01:a.presentationContactSecondaryRadiusScale01,
        presentationDetachedSecondaryRadiusScale01:a.presentationDetachedSecondaryRadiusScale01,
        presentationDetachedSeparation01:a.presentationDetachedSeparation01,
        presentationSeparationAdjusted:a.presentationSeparationAdjusted}),
    }) :
    scientificKind===ScientificBodyPreviewKind.COMET && comet ? (()=>{
      // COM-R3: this 31.4g fiche is a separate construction path from
      // ScientificBodyPreviewAssembler. It MUST use exactly the same activity
      // authority as SystemScene; the compact-host snapshot cannot infer a
      // comet's outgassing from an illustrative host glow or a flux proxy.
      const physical=systemSceneCometActivityAtDistanceV1(comet,comet.periapsisAu,0.42);
      const activity=systemSceneCometActivityVisualParityV1(scene,comet,physical,0.42);
      const unresolved=isCometActivityUnresolvedInSceneV1(scene.stars,scene.generatorVersionCode);
      return Object.freeze({kind:ScientificBodyPreviewKind.COMET,title,
        accessibleLabel:unresolved
          ? `${title}: núcleo procedural; actividad cometaria no resuelta en el anfitrión compacto. No se representa coma ni cola.`
          : `${title}: visualización procedural; actividad evaluada en periastro`,
        primary:Object.freeze({version:1 as const,visualVariantUint32:comet.shapeSeedUint32,
          presentationNucleusColorHex:comet.presentationNucleusColorHex,
          presentationComaColorHex:comet.presentationComaColorHex,
          presentationDustTailColorHex:comet.presentationDustTailColorHex,
          presentationIonTailColorHex:comet.presentationIonTailColorHex,
          presentationNucleusRoughness01:comet.presentationNucleusRoughness01,
          presentationNucleusAxisScaleX:comet.presentationNucleusAxisScaleX,
          presentationNucleusAxisScaleY:comet.presentationNucleusAxisScaleY,
          presentationNucleusAxisScaleZ:comet.presentationNucleusAxisScaleZ,
          presentationNucleusIrregularity01:comet.presentationNucleusIrregularity01}),
        activity:Object.freeze({activityRegime:activity.activityRegime,
          hasComa:activity.hasComa,hasDustTail:activity.hasDustTail,hasIonTail:activity.hasIonTail,
          presentationComaRadiusScale:activity.presentationComaRadiusScale,
          presentationComaOpacity01:activity.presentationComaOpacity01,
          presentationDustTailOpacity01:activity.presentationDustTailOpacity01,
          presentationIonTailOpacity01:activity.presentationIonTailOpacity01,
          presentationComaRadiusScene:activity.presentationComaRadiusScene,
          presentationDustTailLengthScene:activity.presentationDustTailLengthScene,
          presentationDustTailWidthScene:activity.presentationDustTailWidthScene,
          presentationIonTailLengthScene:activity.presentationIonTailLengthScene,
          presentationIonTailWidthScene:activity.presentationIonTailWidthScene}),
      });
    })() :
    scientificKind===ScientificBodyPreviewKind.COMET ? (()=>{
      const neutral = fallbackCompactCometPresentation(body);
      return Object.freeze({kind:ScientificBodyPreviewKind.COMET,
        title,
        accessibleLabel:`${title}: núcleo procedural; actividad cometaria no resuelta en el anfitrión compacto. No se representa coma ni cola.`,
        primary:Object.freeze({version:1 as const,visualVariantUint32:neutral.shapeSeedUint32,
          presentationNucleusColorHex:neutral.presentationNucleusColorHex,
          presentationComaColorHex:neutral.presentationComaColorHex,
          presentationDustTailColorHex:neutral.presentationDustTailColorHex,
          presentationIonTailColorHex:neutral.presentationIonTailColorHex,
          presentationNucleusRoughness01:neutral.presentationNucleusRoughness01,
          presentationNucleusAxisScaleX:neutral.presentationNucleusAxisScaleX,
          presentationNucleusAxisScaleY:neutral.presentationNucleusAxisScaleY,
          presentationNucleusAxisScaleZ:neutral.presentationNucleusAxisScaleZ,
          presentationNucleusIrregularity01:neutral.presentationNucleusIrregularity01}),
        activity:Object.freeze({activityRegime:'DORMANT' as const,
          hasComa:false,hasDustTail:false,hasIonTail:false,
          presentationComaRadiusScale:1,presentationComaOpacity01:0,
          presentationDustTailOpacity01:0,presentationIonTailOpacity01:0,
          presentationComaRadiusScene:0.42,presentationDustTailLengthScene:0,
          presentationDustTailWidthScene:0,presentationIonTailLengthScene:0,
          presentationIonTailWidthScene:0}),
      });
    })() :
    Object.freeze({kind:scientificKind===ScientificBodyPreviewKind.ASTEROID?ScientificBodyPreviewKind.TRANS_NEPTUNIAN_OBJECT:scientificKind,title,
      accessibleLabel:`${title}: visualización de tamaño no comparativo`,
      primary:Object.freeze({title,colorHex:(scientificKind===ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT?captured?.colorHex:tno?.colorHex) ?? '#A6A29C',sourceRadiusScene:0.30,
        ...(scientificKind===ScientificBodyPreviewKind.CAPTURED_EXTRASOLAR_OBJECT
          ? (captured === null ? {} : {presentation:captured})
          : (tno === null ? {} : {presentation:tno}))})});
  return Object.freeze({kind:MinorBodyScientificFicheResolutionKind.AVAILABLE,card:Object.freeze({
    title,kindLabel,summary:`${kindLabel} en sistema compacto. Modelo estadístico condicionado, sin historia de formación inferida.`,
    hostSystemTitle:systemName,accessLabel:'Consulta científica habilitada',
    knowledgeLabel:'Snapshot 31.4g · criba orbital, no simulación N-body',
    locatorLabel:`G${model.galaxyIndex} / S${model.sectorKey} / O${model.galacticObjectIndex} / ${body.proceduralId}`,
    sections:Object.freeze({badges:Object.freeze(['Población modelada','Sin evolución inferida']),sections}),preview,
  })});
}

export function compactMinorTarget(body:CompactHostMinorBody,kind:MinorBodyScientificTargetKind,id:string):boolean {
  return body.proceduralId===id && ((kind==='asteroid' && body.kind===MinorBodyKind.ASTEROID) ||
    (kind==='comet' && body.kind===MinorBodyKind.COMET) ||
    (kind==='tno' && body.kind===MinorBodyKind.TRANS_NEPTUNIAN_OBJECT) ||
    (kind==='captured' && body.kind===MinorBodyKind.CAPTURED_EXTRASOLAR_OBJECT));
}
