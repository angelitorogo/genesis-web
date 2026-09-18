import {type SystemSceneSnapshot} from '../system/system-scene-snapshot';
import {type SystemSceneV2ReferenceFiche} from '../system/system-scene-v2-reference-fiche';

export interface V2ScientificSection {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly facts: readonly Readonly<{label: string; value: string}>[];
}
const fact = (label: string, value: string | number | null | undefined, unit = '') =>
  Object.freeze({label, value: value === null || value === undefined ? 'No determinado' : `${value}${unit}`});
const format = (value: number | null | undefined, unit = '') =>
  value === null || value === undefined ? 'No determinado' : `${value.toPrecision(5)}${unit}`;

/** Scientific data comes ONLY from the authorized V2 catalogues; these
 * sections never resolve a V1 BodyLocator or present estimates as observations. */
export function v2ScientificSections(
  scene: SystemSceneSnapshot,
  bodyId: string,
  fiche: SystemSceneV2ReferenceFiche,
): readonly V2ScientificSection[] {
  const planet = scene.scientificMultihostPlanetsV241?.planets.find(item => item.id === bodyId);
  if (planet !== undefined) {
    const moonSystem = scene.scientificMultihostMoonsV242?.systems.find(item => item.hostPlanetId === bodyId);
    const hz = scene.scientificMultihostHabitabilityV244?.planets.find(item => item.planetId === bodyId);
    const hostZone = scene.scientificMultihostHabitabilityV244?.hosts.find(item => item.hostId === planet.hostId);
    return Object.freeze([
      {id: 'general', title: 'General', summary: 'Identidad, masa, radio y composición estimada del mundo V2.', facts: [
        fact('Tipo', planet.type), fact('Masa', format(planet.physics.massEarth, ' M⊕')),
        fact('Radio', format(planet.physics.radiusEarth, ' R⊕')),
        fact('Densidad', format(planet.physics.densityGramsPerCubicCentimeter, ' g/cm³')),
        fact('Gravedad', format(planet.physics.surfaceGravityEarth, ' g⊕')),
        fact('Fracción de envoltura', format(planet.physics.envelopeMassEarth / planet.physics.massEarth * 100, ' %')),
        fact('Tipo de formación', planet.formationPath.regime),
      ]},
      {id: 'orbit', title: 'Órbita', summary: 'Órbita local alrededor de su propia estrella y contexto binario.', facts: [
        fact('Anfitrión', planet.hostId),
        fact('Semieje mayor', format(planet.physics.semiMajorAxisAu, ' UA')),
        fact('Periastro', format(planet.physics.periapsisAu, ' UA')),
        fact('Apoastro', format(planet.physics.apoapsisAu, ' UA')),
        fact('Periodo', format(planet.physics.periodDays, ' días')),
        fact('Escenario de migración', planet.formationPath.explanation),
        fact('Zona habitable radiativa', hz?.radiativeRelation),
        fact('Zona habitable dinámica', hz?.dynamicallyAvailableRelation),
        fact('HZ anfitriona interior', format(hostZone?.radiativeInnerEdgeAu, ' UA')),
        fact('HZ anfitriona exterior', format(hostZone?.radiativeOuterEdgeAu, ' UA')),
      ]},
      {id: 'surface', title: 'Superficie', summary: 'Regímenes físicos e inventario de agua estimados; no son observaciones.', facts: [
        fact('Régimen superficial', planet.surface.surfaceRegime),
        fact('Albedo de referencia', format(planet.surface.referenceBondAlbedo01)),
        fact('Agua estimada', planet.environment.water.regime),
        fact('Inventario potencial de agua', format(planet.environment.water.inventoryIndex01)),
        fact('Agua líquida superficial estimada', format(planet.environment.water.surfaceLiquidWaterCoverageFraction01 === null ? null : planet.environment.water.surfaceLiquidWaterCoverageFraction01 * 100, ' %')),
        fact('Hielo superficial estimado', format(planet.environment.water.surfaceIceCoverageFraction01 === null ? null : planet.environment.water.surfaceIceCoverageFraction01 * 100, ' %')),
      ]},
      {id: 'atmosphere', title: 'Atmósfera', summary: 'Modelo de retención V2; no implica medición espectroscópica.', facts: [
        fact('Régimen', planet.environment.atmosphere.regime),
        fact('Presión superficial estimada', format(planet.environment.atmosphere.pressurePascal, ' Pa')),
      ]},
      {id: 'climate', title: 'Clima', summary: 'Referencia térmica, sin evolución orbital N-body ni irradiación variable resuelta.', facts: [
        fact('Temperatura de equilibrio', format(planet.thermal.equilibriumTemperatureKelvin, ' K')),
        fact('Temperatura superficial estimada', format(planet.environment.climate.meanSurfaceTemperatureKelvin, ' K')),
        fact('Flujo anfitrión', format(planet.referenceMeanInsolationEarth, ' S⊕')),
        fact('Irradiación conjunta mínima', format(hz?.irradiance.totalMinimumSolar, ' S⊕')),
        fact('Irradiación conjunta máxima', format(hz?.irradiance.totalMaximumSolar, ' S⊕')),
        fact('Estado de las cotas binarias', hz?.irradiance.status),
      ]},
      {id: 'geology', title: 'Geología', summary: 'La composición es un prior V2, no una medición de tectónica o volcanismo.', facts: [
        fact('Masa metálica', format(planet.internalComposition.metallicCoreMassEarth, ' M⊕')),
        fact('Masa silicática', format(planet.internalComposition.silicateInteriorMassEarth, ' M⊕')),
        fact('Masa de hielos', format(planet.internalComposition.condensedIceMassEarth, ' M⊕')),
        fact('Actividad geológica confirmada', 'No determinada'),
      ]},
      {id: 'moons', title: 'Lunas', summary: 'Lunas modeladas individualmente, separadas de la población total estimada.', facts: [
        fact('Población estimada', moonSystem?.estimatedTotalMoonCount),
        fact('Lunas científicas modeladas', moonSystem?.modeledMoonCount),
        fact('Masa lunar modelada', format(moonSystem?.modeledMoonMassEarth, ' M⊕')),
      ]},
      {id: 'comparison', title: 'Comparación con la Tierra', summary: 'Relaciones calculadas a partir de las propiedades físicas V2.', facts: [
        fact('Radio relativo', format(planet.physics.radiusEarth, ' R⊕')),
        fact('Masa relativa', format(planet.physics.massEarth, ' M⊕')),
        fact('Gravedad relativa', format(planet.physics.surfaceGravityEarth, ' g⊕')),
      ]},
    ] as const);
  }
  const moon = scene.scientificMultihostMoonsV242?.moons.find(item => item.id === bodyId);
  if (moon !== undefined) return Object.freeze([
    {id: 'general', title: 'General', summary: 'Propiedades físicas del modelo lunar V2.', facts: fiche.facts.slice(0, 3)},
    {id: 'orbit', title: 'Órbita', summary: 'Órbita planetocéntrica con límites de Roche y Hill.', facts: fiche.facts.slice(3, 6)},
    {id: 'surface', title: 'Superficie y agua', summary: 'Estimaciones ambientales, no observaciones.', facts: [
      fact('Agua estimada', moon.environment.waterRegime),
      fact('Geología estimada', moon.environment.geologyRegime),
      fact('Atmósfera estimada', moon.environment.atmosphereRegime),
      fact('Temperatura estimada', format(moon.environment.estimatedSurfaceTemperatureKelvin, ' K')),
    ]},
  ]);
  return Object.freeze([
    {id: 'general', title: 'General', summary: 'Identidad y características científicas estimadas del cuerpo menor.', facts: fiche.facts.slice(0, 4)},
    {id: 'orbit', title: 'Órbita', summary: 'Parámetros orbitales generados para la estrella anfitriona.', facts: fiche.facts.slice(4)},
  ]);
}
