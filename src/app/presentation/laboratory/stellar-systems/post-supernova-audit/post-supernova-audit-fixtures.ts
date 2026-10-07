import { GeneratorVersion } from '../../../../domain/generation/generator-version';
import { SystemLocator } from '../../../../domain/generation/procedural-locator';
import { UniverseGenerationKey } from '../../../../domain/generation/universe-generation-key';
import { StellarEvolutionInput } from '../../../../domain/stellar/stellar-evolution-input';
import { StellarLifetimeProfile } from '../../../../domain/stellar/stellar-lifetime-profile';
import { StellarPhysicalProperties } from '../../../../domain/stellar/stellar-physical-properties';
import { StellarSystemMultiplicity } from '../../../../domain/stellar/stellar-system-multiplicity';
import { UniverseSeed } from '../../../../domain/universe/universe-seed';
import {
  orbitalPeriodYears,
  resolvePostSupernovaImpulse,
  resolvePostSupernovaMoonStability,
  type PostSupernovaKeplerOrbit,
} from '../../../../simulation/stellar/post-supernova-orbital-response';
import {
  StellarMultihostFormation,
  type GeneratedMultipleHost,
  type GeneratedSingleHost,
} from '../../../../simulation/stellar/stellar-multihost-formation';
import { multihostPhysicalSourceKey } from '../../../../simulation/stellar/stellar-multihost-physical-source-key';
import { StellarEvolutionEngine } from '../../../../simulation/stellar/stellar-evolution-engine';
import { StellarPostSupernovaPlanetaryDynamics } from '../../../../simulation/stellar/stellar-post-supernova-planetary-dynamics';

export type PostSupernovaAuditCaseKind =
  | 'ORBIT_BOUND'
  | 'ORBIT_EJECTED'
  | 'TRIPLE_DISRUPTED'
  | 'CONTROL';

export interface PostSupernovaAuditMetric {
  readonly label: string;
  readonly before: string;
  readonly after: string;
  readonly changed: boolean;
}

export interface PostSupernovaAuditOrbitVisual {
  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly rx: number;
  readonly ry: number;
  readonly cx: number;
}

export interface PostSupernovaAuditCase {
  readonly id: 'A' | 'B' | 'C' | 'D';
  readonly kind: PostSupernovaAuditCaseKind;
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly status: string;
  readonly statusCode: string;
  readonly note: string;
  readonly metrics: readonly PostSupernovaAuditMetric[];
  readonly beforeOrbit: PostSupernovaAuditOrbitVisual | null;
  readonly afterOrbit: PostSupernovaAuditOrbitVisual | null;
  readonly proof: readonly string[];
}

const key = new UniverseGenerationKey(
  UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1'),
  GeneratorVersion.V1,
);

let cachedCases: readonly PostSupernovaAuditCase[] | null = null;

export function buildPostSupernovaAuditCases(): readonly PostSupernovaAuditCase[] {
  if (cachedCases !== null) return cachedCases;

  const cases = Object.freeze([
    buildBoundOrbitCase(),
    buildEjectedOrbitCase(),
    buildTripleDisruptionCase(),
    buildControlCase(),
  ] satisfies readonly PostSupernovaAuditCase[]);

  cachedCases = cases;
  return cases;
}

function buildBoundOrbitCase(): PostSupernovaAuditCase {
  const before = orbitFromElements(5, 0.05, 2);
  const impulse = resolvePostSupernovaImpulse({
    semiMajorAxisAu: before.semiMajorAxisAu,
    eccentricity: before.eccentricity,
    preEventMassSolar: 2,
    postEventMassSolar: 1.5,
    natalKickKmS: 5,
    deterministicKey: '29.1E-g.1|BOUND_RECONFIGURED',
  });

  if (impulse.disposition !== 'BOUND_RECONFIGURED' || impulse.orbit === null) {
    throw new Error('29.1E-g.1 bound audit fixture must remain gravitationally bound.');
  }

  const after = impulse.orbit;
  const beforeMoon = resolvePostSupernovaMoonStability({
    planetSemiMajorAxisAu: before.semiMajorAxisAu,
    planetEccentricity: before.eccentricity,
    planetMassEarth: 1,
    planetRadiusEarth: 1,
    currentHostMassSolar: 2,
    moonSemiMajorAxisPlanetRadii: 30,
    moonEccentricity: 0.02,
  });
  const afterMoon = resolvePostSupernovaMoonStability({
    planetSemiMajorAxisAu: after.semiMajorAxisAu,
    planetEccentricity: after.eccentricity,
    planetMassEarth: 1,
    planetRadiusEarth: 1,
    currentHostMassSolar: 1.5,
    moonSemiMajorAxisPlanetRadii: 30,
    moonEccentricity: 0.02,
  });

  return Object.freeze({
    id: 'A',
    kind: 'ORBIT_BOUND',
    eyebrow: 'CASO A · SUPERVIVENCIA',
    title: 'Planeta ligado · órbita reconfigurada',
    description: 'Pérdida impulsiva moderada y kick natal pequeño. El planeta permanece ligado, pero su órbita actual ya no coincide con la órbita de formación.',
    status: 'BOUND_RECONFIGURED',
    statusCode: 'bound',
    note: 'El diagrama usa los elementos orbitales resueltos por 29.1E-g; la posición angular del planeta es solo una marca de lectura.',
    metrics: Object.freeze([
      metric('Masa gravitante', `${fmt(2, 2)} M☉`, `${fmt(1.5, 2)} M☉`, true),
      metric('Semieje mayor', `${fmt(before.semiMajorAxisAu, 3)} UA`, `${fmt(after.semiMajorAxisAu, 3)} UA`, true),
      metric('Excentricidad', fmt(before.eccentricity, 3), fmt(after.eccentricity, 3), true),
      metric('Período', `${fmt(before.periodYears, 3)} años`, `${fmt(after.periodYears, 3)} años`, true),
      metric('Periastro', `${fmt(before.periastronAu, 3)} UA`, `${fmt(after.periastronAu, 3)} UA`, true),
      metric('Apoastro', `${fmt(before.apoastronAu, 3)} UA`, `${fmt(after.apoastronAu, 3)} UA`, true),
      metric('Límite lunar prógrado', `${fmt(beforeMoon.progradeStableLimitPlanetRadii, 1)} Rp`, `${fmt(afterMoon.progradeStableLimitPlanetRadii, 1)} Rp`, true),
    ]),
    beforeOrbit: orbitVisual(before, before.semiMajorAxisAu),
    afterOrbit: orbitVisual(after, before.semiMajorAxisAu),
    proof: Object.freeze([
      `Kick natal aplicado: ${fmt(5, 1)} km/s.`,
      `Cambio de plano: ${fmt(after.inclinationChangeDegrees, 3)}°.` ,
      `Luna de auditoría a 30 Rp: ${afterMoon.survives ? 'permanece ligada' : 'rebasa el límite de Hill'}.`,
    ]),
  });
}

function buildEjectedOrbitCase(): PostSupernovaAuditCase {
  const before = orbitFromElements(5, 0, 10);
  const impulse = resolvePostSupernovaImpulse({
    semiMajorAxisAu: before.semiMajorAxisAu,
    eccentricity: before.eccentricity,
    preEventMassSolar: 10,
    postEventMassSolar: 1.4,
    natalKickKmS: 0,
    deterministicKey: '29.1E-g.1|EJECTED',
  });

  if (impulse.disposition !== 'EJECTED' || impulse.orbit !== null) {
    throw new Error('29.1E-g.1 ejection audit fixture must be unbound.');
  }

  return Object.freeze({
    id: 'B',
    kind: 'ORBIT_EJECTED',
    eyebrow: 'CASO B · EXPULSIÓN',
    title: 'Planeta expulsado del antiguo host',
    description: 'La pérdida instantánea de masa por sí sola supera el umbral de ligadura. El resultado no necesita un kick favorable para expulsar el planeta.',
    status: 'EJECTED',
    statusCode: 'ejected',
    note: 'La curva de salida es un símbolo de trayectoria no ligada. 29.1E-g no inventa todavía una posición 3D actual ni una propagación hiperbólica temporal.',
    metrics: Object.freeze([
      metric('Masa gravitante', `${fmt(10, 2)} M☉`, `${fmt(1.4, 2)} M☉`, true),
      metric('Semieje mayor', `${fmt(before.semiMajorAxisAu, 3)} UA`, '— · no ligado', true),
      metric('Excentricidad', fmt(before.eccentricity, 3), '≥ 1 · no ligado', true),
      metric('Período', `${fmt(before.periodYears, 3)} años`, '—', true),
      metric('Radio en el evento', `${fmt(impulse.eventRadiusAu, 3)} UA`, `${fmt(impulse.eventRadiusAu, 3)} UA`, false),
      metric('Kick natal', '0,0 km/s', '0,0 km/s', false),
    ]),
    beforeOrbit: orbitVisual(before, before.semiMajorAxisAu),
    afterOrbit: null,
    proof: Object.freeze([
      'La expulsión ocurre incluso con kick natal = 0.',
      'No se asigna una nueva órbita kepleriana cerrada.',
      'La órbita de formación se conserva únicamente como referencia histórica.',
    ]),
  });
}

function buildTripleDisruptionCase(): PostSupernovaAuditCase {
  const source = forcedPostSupernovaFixture(StellarSystemMultiplicity.TRIPLE);
  const dynamics = new StellarPostSupernovaPlanetaryDynamics(source);
  const hierarchy = dynamics.hierarchy;

  if (hierarchy.innerOrbit.disposition !== 'EJECTED' ||
      hierarchy.currentArchitecture !== 'DISRUPTED_HIERARCHY' ||
      hierarchy.outerOrbit?.disposition !== 'HIERARCHY_DISRUPTED') {
    throw new Error('29.1E-g.1 triple fixture must disrupt the A-B hierarchy.');
  }

  return Object.freeze({
    id: 'C',
    kind: 'TRIPLE_DISRUPTED',
    eyebrow: 'CASO C · JERARQUÍA',
    title: 'Triple · binario interior disuelto',
    description: 'A evoluciona desde 16 M☉ y su evento canónico rompe A–B. La órbita exterior (A+B)–C deja de ser una jerarquía físicamente válida y se invalida en bloque.',
    status: 'DISRUPTED_HIERARCHY',
    statusCode: 'disrupted',
    note: 'Esquema jerárquico, no a escala. No se dibuja una órbita exterior superviviente cuando el baricentro A+B que la definía ha dejado de existir.',
    metrics: Object.freeze([
      metric('Masa A', `${fmt(source.components[0]!.physical.initialMassSolar, 2)} M☉`, `${fmt(hierarchy.currentComponentMassesSolar.A, 2)} M☉`, true),
      metric('Órbita interior A–B', `${fmt(source.innerOrbit.semiMajorAxisAu, 2)} UA · e=${fmt(source.innerOrbit.eccentricity, 2)}`, 'EJECTED', true),
      metric('Órbita exterior (A+B)–C', `${fmt(source.outerOrbit!.semiMajorAxisAu, 2)} UA · e=${fmt(source.outerOrbit!.eccentricity, 2)}`, 'HIERARCHY_DISRUPTED', true),
      metric('Arquitectura', 'TRIPLE jerárquico', 'DISRUPTED_HIERARCHY', true),
      metric('Kick efectivo máximo', '0,0 km/s', `${fmt(hierarchy.innerOrbit.maximumEffectiveKickKmS, 1)} km/s`, hierarchy.innerOrbit.maximumEffectiveKickKmS > 0),
    ]),
    beforeOrbit: null,
    afterOrbit: null,
    proof: Object.freeze([
      'A = 16 M☉ a edad común de 1 Gyr; B y C = 1 M☉.',
      'La regresión exige explícitamente innerOrbit = EJECTED.',
      'La órbita exterior queda HIERARCHY_DISRUPTED; no se finge un triple superviviente.',
    ]),
  });
}

function buildControlCase(): PostSupernovaAuditCase {
  const source = controlFixture();
  const dynamics = new StellarPostSupernovaPlanetaryDynamics(source);
  const hierarchy = dynamics.hierarchy;

  if (hierarchy.hasPostSupernovaEvolution || hierarchy.currentArchitecture !== 'BINARY_UNCHANGED') {
    throw new Error('29.1E-g.1 control fixture must remain unchanged.');
  }

  const totalMass = source.components.reduce((sum, host) => sum + host.physical.initialMassSolar, 0);
  const before = orbitFromElements(
    source.innerOrbit.semiMajorAxisAu,
    source.innerOrbit.eccentricity,
    totalMass,
  );
  const after = orbitFromElements(
    hierarchy.innerOrbit.semiMajorAxisAu!,
    hierarchy.innerOrbit.eccentricity!,
    hierarchy.currentComponentMassesSolar.A + hierarchy.currentComponentMassesSolar.B,
  );

  return Object.freeze({
    id: 'D',
    kind: 'CONTROL',
    eyebrow: 'CASO D · CONTROL',
    title: 'Binario sin supernova · sin cambios',
    description: 'Se conserva la masa física real de ambos componentes y se fija la edad común en el origen de la evolución estelar. No existe evento post-supernova realizado y la proyección actual debe ser idéntica a la arquitectura de formación.',
    status: 'BINARY_UNCHANGED',
    statusCode: 'control',
    note: 'Este caso protege contra falsos positivos: activar 29.1E-g no puede reconfigurar sistemas que no hayan sufrido una evolución explosiva aplicable.',
    metrics: Object.freeze([
      metric('Masa total', `${fmt(totalMass, 2)} M☉`, `${fmt(hierarchy.currentComponentMassesSolar.A + hierarchy.currentComponentMassesSolar.B, 2)} M☉`, false),
      metric('Semieje A–B', `${fmt(source.innerOrbit.semiMajorAxisAu, 3)} UA`, `${fmt(hierarchy.innerOrbit.semiMajorAxisAu!, 3)} UA`, false),
      metric('Excentricidad', fmt(source.innerOrbit.eccentricity, 3), fmt(hierarchy.innerOrbit.eccentricity!, 3), false),
      metric('Período', `${fmt(source.innerOrbit.periodYears, 3)} años`, `${fmt(hierarchy.innerOrbit.periodYears!, 3)} años`, false),
      metric('Arquitectura', 'BINARY', 'BINARY_UNCHANGED', false),
    ]),
    beforeOrbit: orbitVisual(before, before.semiMajorAxisAu),
    afterOrbit: orbitVisual(after, before.semiMajorAxisAu),
    proof: Object.freeze([
      'hasPostSupernovaEvolution = false.',
      'No se crean eventos, kicks ni órbitas sustitutas.',
      'El caso control permanece numéricamente idéntico antes/después.',
    ]),
  });
}

function populatedFixture(
  multiplicity: typeof StellarSystemMultiplicity.BINARY | typeof StellarSystemMultiplicity.TRIPLE,
): GeneratedMultipleHost {
  for (let index = 0n; index < 128n; index += 1n) {
    const source = StellarMultihostFormation.generateOrNull(
      key,
      new SystemLocator(0n, 0n, index),
    );
    if (source !== null && source.multiplicity === multiplicity && source.publicPlanets.length > 0) {
      return source;
    }
  }
  throw new Error(`No populated ${multiplicity.name} audit fixture in first 128 objects.`);
}

function forcedPostSupernovaFixture(
  multiplicity: typeof StellarSystemMultiplicity.TRIPLE,
): GeneratedMultipleHost {
  const source = populatedFixture(multiplicity);
  const components = source.components.map(host => forceGroundTruthComponent(
    source,
    host,
    host.label === 'A' ? 16 : 1,
    1,
  ));
  return Object.freeze({ ...source, components: Object.freeze(components) });
}

function controlFixture(): GeneratedMultipleHost {
  const source = populatedFixture(StellarSystemMultiplicity.BINARY);
  const components = source.components.map(host => forceGroundTruthComponent(
    source,
    host,
    host.physical.initialMassSolar,
    0,
  ));
  return Object.freeze({ ...source, components: Object.freeze(components) });
}

function forceGroundTruthComponent(
  source: GeneratedMultipleHost,
  host: GeneratedSingleHost,
  initialMassSolar: number,
  ageBillionYears: number,
): GeneratedSingleHost {
  const physicalKey = multihostPhysicalSourceKey(source.parentGenerationKey);
  const assessment = StellarEvolutionEngine.evaluate(
    physicalKey,
    new StellarEvolutionInput(initialMassSolar, 1, ageBillionYears),
  );
  const terminal = assessment.mainSequenceLifetimeBillionYears === null ||
    assessment.postMainSequenceDurationBillionYears === null
    ? null
    : assessment.mainSequenceLifetimeBillionYears + assessment.postMainSequenceDurationBillionYears;

  return Object.freeze({
    ...host,
    physical: new StellarPhysicalProperties(
      initialMassSolar,
      initialMassSolar,
      host.physical.radiusSolar,
      host.physical.luminositySolar,
      host.physical.effectiveTemperatureKelvin,
    ),
    lifetime: new StellarLifetimeProfile(
      ageBillionYears,
      terminal,
      terminal === null ? null : Math.max(0, terminal - ageBillionYears),
      assessment,
    ),
  });
}

function orbitFromElements(
  semiMajorAxisAu: number,
  eccentricity: number,
  massSolar: number,
): PostSupernovaKeplerOrbit {
  return Object.freeze({
    semiMajorAxisAu,
    eccentricity,
    periodYears: orbitalPeriodYears(semiMajorAxisAu, massSolar),
    periastronAu: semiMajorAxisAu * (1 - eccentricity),
    apoastronAu: semiMajorAxisAu * (1 + eccentricity),
    inclinationChangeDegrees: 0,
  });
}

function orbitVisual(
  orbit: PostSupernovaKeplerOrbit,
  referenceSemiMajorAxisAu: number,
): PostSupernovaAuditOrbitVisual {
  const scale = clamp(orbit.semiMajorAxisAu / referenceSemiMajorAxisAu, 0.68, 1.32);
  const rx = 62 * scale;
  const ry = Math.max(10, rx * Math.sqrt(Math.max(0, 1 - orbit.eccentricity ** 2)));
  return Object.freeze({
    semiMajorAxisAu: orbit.semiMajorAxisAu,
    eccentricity: orbit.eccentricity,
    rx,
    ry,
    cx: 110 + rx * orbit.eccentricity,
  });
}

function metric(
  label: string,
  before: string,
  after: string,
  changed: boolean,
): PostSupernovaAuditMetric {
  return Object.freeze({ label, before, after, changed });
}

function fmt(value: number, digits: number): string {
  return value.toLocaleString('es-ES', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
