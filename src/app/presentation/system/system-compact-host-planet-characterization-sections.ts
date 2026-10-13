import { AtmosphereGas } from '../../domain/planetary/atmosphere-gas';
import { atmospherePressureRegimeForSurfacePressurePascal, AtmospherePressureRegime } from '../../domain/planetary/atmosphere-pressure-regime';
import { planetGeologyRegimeForActivityIndex01, PlanetGeologyRegime } from '../../domain/planetary/planet-geology-regime';
import { planetVolcanismRegimeForIndex01, PlanetVolcanismRegime } from '../../domain/planetary/planet-volcanism-regime';
import { planetTectonicRegimeForMobilityIndex01, PlanetTectonicRegime } from '../../domain/planetary/planet-tectonic-regime';
import { planetMagneticFieldRegimeForIndex01, PlanetMagneticFieldRegime } from '../../domain/planetary/planet-magnetic-field-regime';
import { type CompactHostPlanetCharacterization as Characterization } from '../../domain/planetary/compact-host-planet-characterization';
import { type CompactHostPlanet } from '../../domain/planetary/compact-host-planetary-system';
import { type CompactHostPlanetEnvironment } from '../../domain/planetary/compact-host-planetary-environment';
import { type PlanetScientificFieldModel, type PlanetScientificSectionModel } from '../planet-detail/planet-scientific-sections';
import { type WorldEarthComparisonModel } from '../scientific/world-earth-comparison';
import { planetRadiusKilometers, planetOrbitAuAndKilometers, planetRotationHoursAndDays,
  planetPressurePaBarEarth, planetTemperatureKelvinCelsius, planetTemperatureDifference,
  planetNormalizedPercent } from '../planet-detail/planet-scientific-display-units';
import { unifyPlanetFicheSections } from '../planet-detail/planet-scientific-fiche-layout';

const format = (n:number) => n.toLocaleString('es-ES',{maximumSignificantDigits:5});
const number = (n:number|null, unit:string) => n===null?'No determinado':`${format(n)} ${unit}`;
const percent = (n:number|null) => n===null?'No determinado':`${format(n*100)} %`;
/** Do not render trace partial pressures as twenty-digit percentages. */
const gasPercent = (fraction:number) => fraction > 0 && fraction*100 < 0.001
  ? '<0,001 %' : percent(fraction);
const index = planetNormalizedPercent;
const field=(label:string,value:string,note:string|null=null):PlanetScientificFieldModel => Object.freeze({label,value,note});
const section=(id:PlanetScientificSectionModel['id'],title:string,summary:string,fields:PlanetScientificFieldModel[]):PlanetScientificSectionModel =>
  Object.freeze({id,eyebrow:'SNAPSHOT MODELADO · 31.4h',title,summary,fields:Object.freeze(fields)});
const GAS_LABEL: Readonly<Record<AtmosphereGas,string>> = Object.freeze({
  HYDROGEN:'H₂', HELIUM:'He', NITROGEN:'N₂', OXYGEN:'O₂',
  CARBON_DIOXIDE:'CO₂', WATER_VAPOR:'H₂O', METHANE:'CH₄',ARGON:'Ar',
  SULFUR_DIOXIDE:'SO₂',CARBON_MONOXIDE:'CO',AMMONIA:'NH₃',
});
/** The same domain-level classification thresholds used by ordinary planets.
 * These labels are simulation classes, never measurements of an exoplanet. */
const GEOLOGY_LABELS: Readonly<Record<PlanetGeologyRegime,string>> = Object.freeze({
  DEEP_ENVELOPE:'No evaluable', INERT:'Inerte', LOW_ACTIVITY:'Actividad baja',
  ACTIVE:'Activa', HIGH_ACTIVITY:'Actividad alta', EXTREME_ACTIVITY:'Actividad extrema',
});
const VOLCANISM_LABELS: Readonly<Record<PlanetVolcanismRegime,string>> = Object.freeze({
  DEEP_ENVELOPE:'No evaluable', NONE:'Nulo', LOW:'Bajo', MODERATE:'Moderado',
  HIGH:'Alto', EXTREME:'Extremo',
});
const TECTONICS_LABELS: Readonly<Record<PlanetTectonicRegime,string>> = Object.freeze({
  DEEP_ENVELOPE:'No evaluable', STAGNANT_LID:'Tapa estancada',
  EPISODIC_MOBILITY:'Movilidad episódica', MOBILE_LID:'Tapa móvil',
  PLATE_TECTONICS:'Tectónica de placas (proxy)',
});
const MAGNETIC_LABELS: Readonly<Record<PlanetMagneticFieldRegime,string>> = Object.freeze({
  NONE:'Ausente', WEAK:'Débil', MODERATE:'Moderado', STRONG:'Fuerte',
  VERY_STRONG:'Muy fuerte',
});
function atmosphericRegime(value:Characterization['atmosphereRegime'] | AtmospherePressureRegime):string {
  switch(value){case 'VACUUM':return 'Vacío práctico';case 'TRACE':return 'Traza gaseosa (no implica exosfera)';
    case 'THIN':return 'Delgada';case 'MODERATE':return 'Moderada';case 'DENSE':return 'Densa';
    case 'EXTREME':return 'Extrema';case 'DEEP_ENVELOPE':return 'Envolvente profunda';
    case 'UNRESOLVED':return 'Fase gaseosa no determinada';}
  return 'No determinado';
}
function waterPhase(c:Characterization):string {
  const t=c.surfaceTemperatureScenarioK;
  if(t===null) return 'No resuelta: falta emisión física del anfitrión';
  if(t<273.16) return 'Hielo favorecido si existe agua superficial';
  if((c.surfaceLiquidWaterCoverageFraction01??0)>0)
    return 'Líquido termodinámicamente posible; reservorio no cuantificado';
  return 'Fase condicionada por presión, temperatura e inventario';
}
export function compactHostPlanetScientificSections(planet:CompactHostPlanet,
  env:CompactHostPlanetEnvironment,c:Characterization,comparison:WorldEarthComparisonModel):readonly PlanetScientificSectionModel[]{
  const externalFluxNote='Canales modelados y supuestos explícitos; no equivalen a medición óptica, observación ni evolución histórica.';
  const solarDayHours=1/Math.abs(1/c.rotationPeriodHours*(c.retrograde? -1:1)-1/(planet.orbitalPeriodDays*24));
  const atmosphereDensity=c.atmosphericPressurePa===null || c.meanMolarMassGramsPerMole===null ||
    c.surfaceTemperatureScenarioK===null ? null : c.atmosphericPressurePa*
      c.meanMolarMassGramsPerMole/1000/(8.314462618*c.surfaceTemperatureScenarioK);
  const atmosphereNote='Inventario hipotético, cribado parcial de escape y condensación condicionada; no es supervivencia atmosférica confirmada. El viento y las partículas siguen sin cuantificarse.';
  const retentionNote='Factor de escape parcial (gravedad y canal energético modelado); NO es porcentaje de atmósfera realmente superviviente: falta historia de escape, espectro, exobase y presión del viento.';
  const waterNote='La masa del reservorio no se modela; no se pueden deducir porcentajes globales de hielo, líquido y vapor. La cobertura es una hipótesis visual condicionada por temperatura e inventario adimensional.';
  const cryogenicNote=c.surfaceTemperatureScenarioK!==null && c.surfaceTemperatureScenarioK<85
    ? 'Curvas de sublimación extrapoladas por debajo de los puntos triples de algunas especies (N₂/CO/Ar); la atmósfera residual es una cota aproximada del escenario, no una medición.'
    : 'Equilibrio de condensación multiespecie condicionado; no se modelan ciclos atmosféricos ni transporte local.';
  const climateNote='Temperatura y clima solo del escenario radiativo condicionado, no temperatura superficial observada. Sin mezclar iluminación visual.';
  return unifyPlanetFicheSections(Object.freeze([
    section('general','General','Magnitudes intrínsecas y estructura interna simulada, con priors independientes de las órbitas 31.2.',[
      field('Tipo planetario',planet.bulkKind==='ROCKY'?'Rocoso':'Supertierra'),
      field('Masa',number(planet.massEarth,'M⊕')),field('Radio',planetRadiusKilometers(planet.radiusEarth)),
      field('Densidad media',number(planet.meanDensityKgM3/1000,'g/cm³')),
      field('Gravedad superficial',`${format(planet.massEarth/planet.radiusEarth**2)} g⊕ · ${format(9.80665*planet.massEarth/planet.radiusEarth**2)} m/s²`),
      field('Rotación simulada',`${planetRotationHoursAndDays(c.rotationPeriodHours)} · ${c.retrograde?'retrógrada':'prógrada'}`,'Prior snapshot; no simulación del frenado por mareas histórico.'),
      field('Duración del día aparente simulada',Number.isFinite(solarDayHours)?number(solarDayHours,'h'):'No definida (rotación sincronizada)'),
      field('Inclinación axial simulada',number(c.axialTiltDegrees,'°')),
      field('Albedo de Bond supuesto',format(c.albedoBond01)),
      field('Composición interna simulada',`núcleo ${percent(c.coreFraction01)} · silicatos ${percent(c.silicateFraction01)} · hielos ${percent(c.iceInteriorFraction01)} · volátiles ${percent(c.volatileInteriorFraction01)}`),
      field('Coherencia del modelo','Cribado Roche/Hill · estabilidad N-body no validada'),
    ]),
    section('orbit','Órbita','Parámetros keplerianos de 31.2 sin evolución post-supernova inferida.',[
      field('Semieje mayor',planetOrbitAuAndKilometers(planet.semiMajorAxisAu)),
      field('Excentricidad',format(planet.eccentricity)),
      field('Inclinación orbital','No modelada'),
      field('Periastro',planetOrbitAuAndKilometers(planet.periastronAu)),
      field('Apoastro',planetOrbitAuAndKilometers(planet.apoastronAu)),
      field('Período orbital',`${format(planet.orbitalPeriodDays)} días · ${format(planet.orbitalPeriodDays/365.25)} años`),
      field('Límite de Roche',number(planet.rocheLimitAu,'UA')),
      field('Zona habitable radiativa','No definida para este escenario compacto'),
      field('Zona habitable dinámica','No evaluada con integración N-body'),
      field('Forzamiento de marea (proxy)',index(c.tidalHeatingIndex01)),
    ]),
    section('surface','Superficie','Inventario snapshot y fases del agua condicionadas por el escenario atmosférico.',[
      field('Base superficial','Regolito mineral sólido (modelo rocoso)'),
      field('Índice de rugosidad',index(c.roughnessIndex01)),
      field('Inventario de agua modelado',index(c.waterInventoryIndex01),'Prior adimensional; no implica océanos medidos.'),
      field('Fase de agua',waterPhase(c)),
      field('Fracciones hielo / líquido / vapor','No cuantificables sin masa del reservorio',waterNote),
      field('Agua líquida superficial',c.surfaceTemperatureScenarioK===null?'No determinada':
        c.surfaceLiquidWaterCoverageFraction01===null?'No determinada':
          c.surfaceLiquidWaterCoverageFraction01>0?'Posible en escenario; no confirmada':'No persistente en escenario condicionado',
        'El modelo no acredita agua líquida observada ni inventario másico del reservorio.'),
      field('Cobertura potencial de hielo (ilustrativa)',percent(c.surfaceIceCoverageFraction01),waterNote),
      field('Cobertura potencial de líquido (ilustrativa)',percent(c.surfaceLiquidWaterCoverageFraction01),
        'Condicionada por un reservorio superficial disponible; no se incorpora al índice de mundos con agua conocida.'),
      field('Exposición energética modelada',index(c.radiationExposureIndex01)),
      field('Protección magnetosférica modelada',index(c.magneticProtectionIndex01)),
      field('Entorno de partículas no cuantificado',env.particleEnvironment==='UNRESOLVED'?'No determinado':env.particleEnvironment),
      field('Radiación superficial','No evaluable','El flujo de partículas y el blindaje atmosférico no están caracterizados.'),
      field('Protección radiativa','No evaluable','El índice de campo magnético no demuestra protección radiativa superficial.'),
    ]),
    section('atmosphere','Atmósfera','Inventario simulado, escape condicionado y equilibrio multiespecie del motor de GENESIS.',[
      field('Régimen gaseoso potencial',atmosphericRegime(atmospherePressureRegimeForSurfacePressurePascal(c.initialPressurePa)), 'Clasificación del inventario inicial hipotético; no implica que se conserve una atmósfera real.'),
      field('Presión potencial inicial',number(c.initialPressurePa,'Pa'),atmosphereNote),
      field('Presión tras factor de escape parcial (antes de condensación)',number(c.retainedPressureBeforeCondensationPa,'Pa'),retentionNote),
      field('Régimen gaseoso final',atmosphericRegime(c.atmosphereRegime)),
      field('Estado atmosférico',c.atmosphericPressurePa===null?'No determinado':
        c.atmosphereRegime==='VACUUM'?'Vacío en escenario condicionado':'Atmósfera de escenario; supervivencia no evaluada',
        'Estado condicionado, no confirmado a partir de evolución o observación.'),
      field('Presión gaseosa escenario',planetPressurePaBarEarth(c.atmosphericPressurePa),
        c.atmosphericPressurePa===null?'No calculable sin forzamiento térmico estable.':atmosphereNote),
      field('Factor de retención por escape (proxy parcial)',percent(c.gasRetentionFraction01),retentionNote),
      field('Composición gaseosa escenario',c.atmosphericGasMoleFractions===null?'No determinada':
        c.atmosphericGasMoleFractions.map(g=>`${GAS_LABEL[g.gas]} ${gasPercent(g.fraction01)}`).join(' · ')),
      field('Masa molar media',number(c.meanMolarMassGramsPerMole,'g/mol')),
      field('Densidad gaseosa escenario',number(atmosphereDensity,'kg/m³')),
      field('Velocidad de escape',number(env.escapeVelocityKmS,'km/s')),
      field('Efecto invernadero escenario',c.greenhouseTrappingFraction01===null?'No determinado':`Captura de onda larga ${percent(c.greenhouseTrappingFraction01)} (escenario)`, 'Índice radiativo condicionado, no una medición de captura atmosférica.'),
      field('Condensación criogénica / límites',c.surfaceTemperatureScenarioK===null?'No evaluable sin temperatura':
        c.surfaceTemperatureScenarioK<85?'Extrapolación por debajo de puntos triples':'Escenario multiespecie',cryogenicNote),
      field('Erosión por viento/partículas','No cuantificada; requiere espectro y presión del viento'),
    ]),
    section('climate','Clima','Balance radiativo y columna multiespecie, sin convertir imágenes ilustrativas en energía física.',[
      field('Balance radiativo del anfitrión',c.climateAssessment==='CONDITIONAL_REFERENCE'?'Escenario modelado':'No resuelto: emisión física ausente'),
      field('Temperatura radiativa de 31.3',number(env.referenceRadiativeTemperatureK,'K'),externalFluxNote),
      field('Acoplamiento radiativo de referencia',
        'Térmico 30 % · energético 5 % · acreción física 15 %',
        'Coeficientes efectivos supuestos, independientes del albedo de Bond; no sumar de nuevo (1 − albedo). La emisión de partículas no cuantificada queda fuera.'),
      field('Calor geotérmico incluido',number(c.internalHeatFluxReferenceWm2,'W/m²'),
        '31.3 muestra solo la referencia radiativa del anfitrión; el equilibrio 31.4h incluye además este flujo interno hipotético.'),
      field('Temperatura de equilibrio escenario',planetTemperatureKelvinCelsius(c.equilibriumTemperatureK),climateNote),
      field('Temperatura superficial escenario',planetTemperatureKelvinCelsius(c.surfaceTemperatureScenarioK),climateNote),
      field('Temperatura superficial real','No determinada'),
      field('Calentamiento invernadero escenario',planetTemperatureDifference(c.greenhouseWarmingScenarioK)),
      field('Estabilidad climática proxy',index(c.climateStabilityIndex01)),
      field('Amplitud estacional escenario',planetTemperatureDifference(c.seasonalAmplitudeK)),
      field('Rango térmico diurno escenario',planetTemperatureDifference(c.diurnalTemperatureRangeK)),
      field('Extremos escenario',c.surfaceMinimumScenarioK===null?'No determinados':
        `${planetTemperatureKelvinCelsius(c.surfaceMinimumScenarioK)} → ${planetTemperatureKelvinCelsius(c.surfaceMaximumScenarioK)}`),
      field('Redistribución térmica',index(c.heatRedistributionIndex01)),
      field('Flujo térmico de referencia',number(env.modeledThermalFluxWm2,'W/m²'),externalFluxNote),
      field('Flujo energético modelado',number(env.modeledEnergeticFluxWm2,'W/m²'),externalFluxNote),
      field('Flujo de acreción físico',number(env.modeledAccretionBolometricFluxWm2,'W/m²'),
        'El disco ilustrativo de un agujero negro quiescente NO cuenta como irradiación.'),
    ]),
    section('geology','Geología','Actividad interna y magnetismo: proxies snapshot, sin edad/progenitor ni evolución inventados.',[
      field('Régimen geológico',GEOLOGY_LABELS[planetGeologyRegimeForActivityIndex01(c.geologyActivityIndex01)], 'Régimen simulado; no observación ni evolución inferida.'),
      field('Actividad geológica',index(c.geologyActivityIndex01)),
      field('Vulcanismo',VOLCANISM_LABELS[planetVolcanismRegimeForIndex01(c.volcanismIndex01)], `Índice ${index(c.volcanismIndex01)}; régimen simulado.`),
      field('Tectónica',TECTONICS_LABELS[planetTectonicRegimeForMobilityIndex01(c.tectonicMobilityIndex01)], `Movilidad ${index(c.tectonicMobilityIndex01)}; no se resuelven placas individuales.`),
      field('Retención de calor interno',index(c.internalHeatRetentionIndex01)),
      field('Flujo interno de referencia',number(c.internalHeatFluxReferenceWm2,'W/m²'),
        'Prior geofísico, no medición ni calor interno reconstruido desde una supernova.'),
      field('Contribución de marea',index(c.tidalHeatingIndex01)),
      field('Desgasificación volátil',index(c.outgassingIndex01)),
      field('Renovación superficial',index(c.surfaceRenewalIndex01)),
      field('Potencial de dínamo',index(c.dynamoIndex01)),
      field('Campo magnético',MAGNETIC_LABELS[planetMagneticFieldRegimeForIndex01(c.magneticFieldIndex01)], `Índice ${index(c.magneticFieldIndex01)}; intensidad no medida.`),
      field('Magnetosfera','No evaluable','Falta presión de viento, geometría del campo y entorno de partículas.'),
      field('Protección magnetosférica',index(c.magneticProtectionIndex01),
        'Sin espectro completo ni presión de viento, no afirma blindaje real.'),
    ]),
    section('moons','Lunas','El modelo 31.2 no genera lunas ni permite deducir su ausencia física.',[
      field('Lunas modeladas','Ninguna (población no simulada)'),
      field('Lunas con caracterización individual','No disponibles'),
      field('Potencial de lunas subsuperficiales','No evaluado'),
    ]),
    section('comparison','Comparación con la Tierra','Magnitudes relativas físicas modeladas, sin extrapolar habitabilidad.',[
      // Identical labels and Earth-relative meaning to the conventional fiche.
      // These are presentation projections of existing comparison values.
      field('Radio relativo',`${format(comparison.radiusEarth)} × el radio terrestre`),
      field('Masa relativa',`${format(comparison.massEarth)} × la masa terrestre`),
      field('Área superficial relativa',`${format(comparison.surfaceAreaEarth)} × la superficie terrestre`,
        'Derivada del cuadrado del radio relativo.'),
      field('Volumen relativo',`${format(comparison.volumeEarth)} × el volumen terrestre`,
        'Derivado del cubo del radio relativo.'),
      field('Densidad relativa',`${format(comparison.densityEarth)} × la densidad media terrestre`),
      field('Gravedad superficial relativa',`${format(comparison.surfaceGravityEarth)} × la gravedad terrestre`),
    ]),
  ]));
}
