import { DiscoveryState } from '../../domain/discovery/discovery-state';
import { type SystemSceneSnapshot } from './system-scene-snapshot';

export interface SystemSceneV2ReferenceFiche {
  readonly kind: 'PLANET' | 'MOON' | 'ASTEROID' | 'COMET';
  readonly title: string;
  readonly hostId: 'A' | 'B';
  readonly facts: readonly Readonly<{label: string; value: string}>[];
  readonly provenance: string;
}

/** The binary scientific records have V2 identities, not V1 BodyLocators.
 * Display their OWN read-only fiche, never navigate to an unrelated V1 planet.
 * The complete catalogues are only present in explicitly enabled V2 scenes. */
export function systemSceneV2ReferenceFiche(
  scene: SystemSceneSnapshot,
  bodyId: string,
  requireVisible = true,
): SystemSceneV2ReferenceFiche | null {
  if (scene.multiplicityName !== 'BINARY' ||
      scene.discoveryStateCode < DiscoveryState.CONFIRMED.code ||
      scene.scientificMultihostPlanetsV241 === undefined ||
      scene.scientificMultihostMoonsV242 === undefined ||
      scene.scientificMultihostMinorBodiesV243 === undefined ||
      scene.scientificMultihostHabitabilityV244 === undefined) return null;
  const visible = [...scene.planets, ...scene.moons, ...scene.minorBodies]
    .some(body => body.id === bodyId);
  if (requireVisible && !visible) return null;
  const fact = (label: string, value: string) => Object.freeze({label, value});
  const num = (value: number, precision = 4) => value.toPrecision(precision);
  const planet = scene.scientificMultihostPlanetsV241.planets.find(item => item.id === bodyId);
  if (planet !== undefined) {
    if (planet.hostId !== 'A' && planet.hostId !== 'B') return null;
    const hz = scene.scientificMultihostHabitabilityV244.planets.find(item => item.planetId === bodyId);
    return Object.freeze({
      kind: 'PLANET' as const, title: planet.designation, hostId: planet.hostId,
      facts: Object.freeze([
        fact('Tipo físico', planet.type),
        fact('Masa', `${num(planet.physics.massEarth)} M⊕`),
        fact('Radio', `${num(planet.physics.radiusEarth)} R⊕`),
        fact('Semieje mayor', `${num(planet.physics.semiMajorAxisAu)} UA`),
        fact('Periastro / apoastro', `${num(planet.physics.periapsisAu)} / ${num(planet.physics.apoapsisAu)} UA`),
        fact('Periodo orbital', `${num(planet.physics.periodDays, 5)} días`),
        fact('Formación', planet.formationPath.regime),
        fact('Atmósfera estimada', planet.environment.atmosphere.regime),
        fact('Temperatura superficial estimada', planet.environment.climate.meanSurfaceTemperatureKelvin === null
          ? 'No definida' : `${num(planet.environment.climate.meanSurfaceTemperatureKelvin)} K`),
        fact('Agua estimada', planet.environment.water.regime),
        fact('Relación con HZ A/B', hz?.radiativeRelation ?? 'No evaluada'),
      ]),
      provenance: 'Modelo circumestelar V2 estimado; no es una observación ni una ficha V1 confirmada.',
    });
  }
  const moon = scene.scientificMultihostMoonsV242.moons.find(item => item.id === bodyId);
  if (moon !== undefined) return Object.freeze({
    kind: 'MOON' as const, title: moon.designation, hostId: moon.hostId,
    facts: Object.freeze([
      fact('Planeta anfitrión', scene.scientificMultihostPlanetsV241.planets.find(p => p.id === moon.hostPlanetId)?.designation ?? moon.hostPlanetId),
      fact('Masa', `${num(moon.massEarth)} M⊕`),
      fact('Radio', `${num(moon.radiusEarth)} R⊕`),
      fact('Órbita planetocéntrica', `${num(moon.semiMajorAxisPlanetRadii)} radios planetarios`),
      fact('Periodo', `${num(moon.periodDays)} días`),
      fact('Límites dinámicos', `Roche ${num(moon.rocheLimitPlanetRadii)} / Hill ${num(moon.hillRadiusPlanetRadii)} radios planetarios`),
      fact('Agua estimada', moon.environment.waterRegime),
    ]),
    provenance: 'Modelo lunar V2 estimado, no observación ni MoonLocator V1.',
  });
  const minor = scene.scientificMultihostMinorBodiesV243.bodies.find(item => item.id === bodyId);
  if (minor === undefined) return null;
  return Object.freeze({
    kind: minor.kind, title: minor.designation, hostId: minor.hostId,
    facts: Object.freeze([
      fact('Tipo', minor.kind),
      fact('Diámetro', `${num(minor.diameterKilometers)} km`),
      fact('Masa', `${num(minor.massEarth)} M⊕`),
      fact('Composición estimada', minor.composition),
      fact('Excentricidad', num(minor.eccentricity)),
      fact('Periastro / apoastro', `${num(minor.periapsisAu)} / ${num(minor.apoapsisAu)} UA`),
      fact('Origen cometario', minor.cometOrbitClass ?? 'No aplica'),
    ]),
    provenance: 'Modelo de cuerpos menores V2 estimado; identidad distinta de los registros V1.',
  });
}
