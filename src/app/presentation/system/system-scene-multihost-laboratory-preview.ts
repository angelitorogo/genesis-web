import { createMultihostPreviewMoonV221 } from './system-scene-multihost-preview-moons';
import { generateBinaryEcosystemV23, type BinaryEcosystemV23 } from '../../simulation/planetary/multihost-binary-ecosystem-generator';
import { binaryPlanetScientificV241 } from './system-scene-multihost-binary-ecosystem';
import { generateMultihostScientificMinorBodiesV243 } from '../../simulation/planetary/multihost-scientific-minor-body-generator-v243';
import { materializeBinaryScientificMinorBodiesV243 } from './system-scene-multihost-scientific-minor-bodies-v243';
import { generateMultihostScientificPlanetsV241 } from '../../simulation/planetary/multihost-scientific-planet-generator-v241';
import { generateMultihostScientificMoonsV242 } from '../../simulation/planetary/multihost-scientific-moon-generator-v242';
import { projectMultihostScientificMoonV242 } from './system-scene-multihost-scientific-moons-v242';
import { type MultihostScientificMoonCatalogV242 } from '../../domain/planetary/multihost-scientific-moon-v242';
import { type MultihostScientificPlanetCatalogV241 } from '../../domain/planetary/multihost-scientific-planet-v241';
import { generateMultihostCircumstellarHabitableZonesV23 } from '../../simulation/planetary/multihost-circumstellar-habitable-zone-generator';
import { withMultihostLaboratoryStellarCadenceV221 } from './system-scene-multihost-star-cadence';
import {
  buildSystemSceneMultihostHierarchicalLayoutV222,
} from './system-scene-multihost-hierarchical-layout';
import {
  buildSystemSceneBinarySubsystemLayoutV224,
} from './system-scene-multihost-binary-layout';
import {
  type MultihostFormedPlanetarySystemV22,
  type MultihostFormedPlanetV22,
} from '../../domain/planetary/multihost-formed-planetary-system';
import {
  type MultihostOrbitalHostId,
  type MultihostPlanetaryCatalog,
} from '../../domain/planetary/multihost-planetary-catalog';
import {
  MULTIHOST_V221_SECONDS_PER_ORBIT,
  multihostPresentationTimeScaleV221,
} from './system-scene-multihost-laboratory-cadence';
import {
  systemSceneMultihostProjectedRadiusV22,
  type SystemSceneMultihostRadialProjectionV22,
} from './system-scene-multihost-radial-projection';
import {
  isSystemSceneMultihostPlanetRenderBindingV221,
  selectMultihostPlanetsForRenderingV221,
  systemSceneMultihostRenderBudgetV221,
  type SystemSceneMultihostPlanetRenderBindingV221,
} from './system-scene-multihost-render-consistency';
import {
  projectSystemSceneMotionContributions,
} from './system-scene-motion-projection';
import {
  SystemSceneProjectionSpace,
  systemSceneProjectedRadiusAuInSpace,
} from './system-scene-scale-projection';
import {
  type SystemSceneBodySnapshot,
  type SystemSceneMoonSnapshot,
  type SystemSceneMultihostHabitableZoneV23,
  type SystemSceneMotionContributionSnapshot,
  type SystemSceneOrbitSnapshot,
  type SystemSceneOrbitalMotionSnapshot,
  type SystemSceneSnapshot,
} from './system-scene-snapshot';

/**
 * Opt-in laboratory renderer for V2.1/V2.2.
 *
 * V2.2.1 is deliberately a PRESENTATION boundary: the full formed aggregate is
 * left untouched, while a bounded balanced subset is materialized as complete
 * renderable planets. Every rendered V2.2 planet has an orbit, motion, host,
 * physical orbital period and a live translation binding. Binary A/B uses
 * V2.4.2 planetocentric science; older triple previews remain QA satellites.
 */
export function buildSystemSceneMultihostLaboratoryPreview(
  snapshot: SystemSceneSnapshot,
  catalog: MultihostPlanetaryCatalog,
  familyFilter: 'ALL' | 'S_TYPE' | 'P_TYPE' = 'ALL',
  formedSystem: MultihostFormedPlanetarySystemV22 | null = null,
): SystemSceneSnapshot {
  if (
    formedSystem !== null &&
    formedSystem.sourceSystemSeed !== catalog.sourceSystemSeed.toUpperCase()
  ) {
    throw new RangeError('V2.2 formed bodies and V2.1 host windows must share SystemSeed.');
  }

  const base = formedSystem === null
    ? snapshot
    : withMultihostLaboratoryStellarCadenceV221(snapshot);
  const stars = new Map(base.stars.map(star => [star.label, star]));
  // FIRST BINARY-ONLY QA PASS: show two moving circumstellar systems, A and B.
  // Do not display the legacy barycentric V1 planet layer alongside them:
  // those worlds have a different, frozen host and would leave orphan guides
  // in the middle. None of this changes the source snapshot or formed catalog.
  const binarySOnly = formedSystem !== null && base.multiplicityName === 'BINARY';
  const motions: SystemSceneOrbitalMotionSnapshot[] = [...base.motions];
  const orbits: SystemSceneOrbitSnapshot[] = binarySOnly
    ? base.orbits.filter(orbit => orbit.kind === 'stellar')
    : [...base.orbits];
  const planets: SystemSceneBodySnapshot[] = binarySOnly ? [] : [...base.planets];
  const moons: SystemSceneMoonSnapshot[] = binarySOnly ? [] : [...base.moons];
  const maximumVisibleRadius = base.scale.outerRadiusAu;
  const budget = systemSceneMultihostRenderBudgetV221(base.multiplicityName);

  const ecosystem: BinaryEcosystemV23 | null = binarySOnly && formedSystem !== null && familyFilter !== 'P_TYPE'
    ? generateBinaryEcosystemV23(formedSystem, {
        A: stars.get('A')?.sourceLuminositySolar,
        B: stars.get('B')?.sourceLuminositySolar,
      })
    : null;
  const stylesById = new Map(ecosystem?.planets.map(item => [item.planetId, item]) ?? []);
  const scientificPlanetsV241 = binarySOnly && formedSystem !== null && familyFilter !== 'P_TYPE'
    ? generateMultihostScientificPlanetsV241(formedSystem, {
        A: stars.get('A')?.sourceLuminositySolar,
        B: stars.get('B')?.sourceLuminositySolar,
      })
    : null;
  const scienceById = new Map(scientificPlanetsV241?.planets.map(item => [item.id, item]) ?? []);
  const scientificMoonsV242 = binarySOnly && formedSystem !== null && scientificPlanetsV241 !== null
    ? generateMultihostScientificMoonsV242(formedSystem, scientificPlanetsV241)
    : null;
  const moonSystemByPlanet = new Map(scientificMoonsV242?.systems.map(item => [item.hostPlanetId, item]) ?? []);
  const scientificMinorBodiesV243 = binarySOnly && formedSystem !== null && familyFilter !== 'P_TYPE'
    ? generateMultihostScientificMinorBodiesV243(formedSystem, {
        A: stars.get('A')?.sourceLuminositySolar,
        B: stars.get('B')?.sourceLuminositySolar,
      })
    : null;

  const candidateBodies = formedSystem === null
    ? catalog.candidates.filter(candidate =>
        (familyFilter === 'ALL' || candidate.family === familyFilter) &&
        candidate.apoapsisAu <= maximumVisibleRadius)
    : selectMultihostPlanetsForRenderingV221(
        formedSystem.planets.filter(planet =>
          (!binarySOnly || (planet.family === 'S_TYPE' &&
            (planet.hostId === 'A' || planet.hostId === 'B'))) &&
          planet.apoapsisAu <= maximumVisibleRadius &&
          planet.periapsisAu > 0 &&
          Number.isFinite(planet.periodDays) && planet.periodDays > 0 &&
          Number.isFinite(planet.semiMajorAxisAu) && planet.semiMajorAxisAu > 0 &&
          Number.isFinite(planet.eccentricity) &&
          planet.eccentricity >= 0 && planet.eccentricity < 1),
        base.multiplicityName,
        familyFilter,
      ).slice(0, Math.max(0, budget.globalPlanetCap - planets.length));

  const localLinearByHost = buildQaLocalLinearProjectionByHost(
    candidateBodies, base, stars,
  );
  // Derive the stellar flux references BEFORE projecting each local disk, so
  // binary A and B may use the exact V1 SINGLE/V3 HZ-focused radial algorithm.
  const referenceZones = binarySOnly
    ? generateMultihostCircumstellarHabitableZonesV23(
        catalog.windows,
        {A: stars.get('A')?.sourceLuminositySolar, B: stars.get('B')?.sourceLuminositySolar},
      )
    : Object.freeze([]);
  const fallbackLayout = formedSystem === null
    ? null
    : buildSystemSceneMultihostHierarchicalLayoutV222(candidateBodies, base, stars);
  // Regression fix: the binary-specific builder previously existed only in
  // specs; the live LAB preview still used a 1.9-unit generic disk cap.
  const layoutPlan = binarySOnly && fallbackLayout !== null
    ? buildSystemSceneBinarySubsystemLayoutV224(
        candidateBodies, base, stars, fallbackLayout, referenceZones)
    : fallbackLayout;
  const hostRadialProjections = layoutPlan?.radialProjections ??
    new Map<string, SystemSceneMultihostRadialProjectionV22>();

  // The scientific source is the same V1 stellar luminosity and V1 18.6
  // effective-flux constants, evaluated independently in each V2.1 S-window.
  // No V1 barycentric HZ is copied to either star.
  const multihostHabitableZonesV23: SystemSceneMultihostHabitableZoneV23[] = [];
  for (const reference of referenceZones) {
    const star = stars.get(reference.hostId);
    if (star === undefined) continue;
    const spec = hostRadialProjections.get(reference.hostId);
    const project = (au: number) => spec === undefined
      ? systemSceneProjectedRadiusAuInSpace(au, base.scale, SystemSceneProjectionSpace.GLOBAL)
      : systemSceneMultihostProjectedRadiusV22(au, spec);
    const inner = reference.dynamicallyHabitableInnerEdgeAu;
    const outer = reference.dynamicallyHabitableOuterEdgeAu;
    multihostHabitableZonesV23.push(Object.freeze({
      ...reference,
      topology: 'CIRCUMSTELLAR' as const,
      radiativeReferenceApplicable: true,
      radiativeReferenceRegime: 'V1_HOST_ONLY_REFERENCE',
      radiativeInnerRadiusScene: project(reference.radiativeInnerEdgeAu),
      radiativeOuterRadiusScene: project(reference.radiativeOuterEdgeAu),
      dynamicallyHabitableInnerRadiusScene: inner === null ? null : project(inner),
      dynamicallyHabitableOuterRadiusScene: outer === null ? null : project(outer),
      presentationAdjusted: false,
      anchorMotionContributions: star.motionContributions,
      projectionSpace: SystemSceneProjectionSpace.GLOBAL,
    }));
  }

  const renderedFormedById = new Map<string, MultihostFormedPlanetV22>();

  for (const candidate of candidateBodies) {
    const formed = formedSystem === null ? null : candidate as MultihostFormedPlanetV22;
    const anchor = hostAnchor(candidate.hostId, base, stars);
    if (anchor === null) continue;

    const space = base.multiplicityName === 'TRIPLE'
      ? candidate.hostId === 'ABC'
        ? SystemSceneProjectionSpace.TRIPLE_OUTER
        : SystemSceneProjectionSpace.TRIPLE_LOCAL
      : SystemSceneProjectionSpace.GLOBAL;
    const hostRadialProjectionV22 = formed === null
      ? undefined
      : hostRadialProjections.get(candidate.hostId);
    const localLinearScenePerAu = formed === null || hostRadialProjectionV22 === undefined
      ? localLinearByHost.get(candidate.hostId)
      : undefined;
    const motionId = `${candidate.id}-motion`;
    const orbitId = `${candidate.id}-orbit`;
    const motion: SystemSceneOrbitalMotionSnapshot = Object.freeze({
      id: motionId,
      semiMajorAxisAu: candidate.semiMajorAxisAu,
      eccentricity: candidate.eccentricity,
      periodDays: candidate.periodDays,
      rotationDegrees: candidate.rotationDegrees,
      inclinationDegrees: candidate.inclinationDegrees,
      epochMeanAnomalyDegrees: candidate.epochMeanAnomalyDegrees,
    });

    const targetSeconds = candidate.family === 'S_TYPE'
      ? MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_S
      : MULTIHOST_V221_SECONDS_PER_ORBIT.PLANET_P;
    const contribution = Object.freeze({
      motionId,
      scale: 1,
      presentationTimeScale: laboratoryOrbitalTimeScale(
        candidate.periodDays,
        base.simulation.playbackDaysPerRealSecond,
        targetSeconds,
      ),
      projectionSpace: space,
      ...(localLinearScenePerAu === undefined ? {} : { linearScenePerAu: localLinearScenePerAu }),
      ...(hostRadialProjectionV22 === undefined ? {} : { hostRadialProjectionV22 }),
    } satisfies SystemSceneMotionContributionSnapshot);
    const contributions: readonly SystemSceneMotionContributionSnapshot[] = Object.freeze([
      ...anchor,
      contribution,
    ]);
    const project = (au: number) => hostRadialProjectionV22 !== undefined
      ? systemSceneMultihostProjectedRadiusV22(au, hostRadialProjectionV22)
      : localLinearScenePerAu === undefined
        ? systemSceneProjectedRadiusAuInSpace(au, base.scale, space)
        : au * localLinearScenePerAu;

    const orbit = Object.freeze({
      id: orbitId,
      kind: 'planetary' as const,
      label: formed === null
        ? `${candidate.hostId} · candidato ${candidate.ordinal}`
        : formed.designation,
      colorHex: hostColor(candidate.hostId),
      opacity: formed === null ? 0.65 : 0.78,
      semiMajorScene: project(candidate.semiMajorAxisAu),
      semiMinorScene: project(
        candidate.semiMajorAxisAu * Math.sqrt(1 - candidate.eccentricity ** 2),
      ),
      focusOffsetScene: project(candidate.semiMajorAxisAu * candidate.eccentricity),
      rotationDegrees: candidate.rotationDegrees,
      inclinationDegrees: candidate.inclinationDegrees,
      motionId,
      motionScale: 1,
      anchorMotionContributions: anchor,
      ...(hostRadialProjectionV22 === undefined ? {} : {hostRadialProjectionV22}),
      ...(localLinearScenePerAu === undefined ? {} : { linearScenePerAu: localLinearScenePerAu }),
      ...(space === SystemSceneProjectionSpace.GLOBAL ? {} : { projectionSpace: space }),
    } satisfies SystemSceneOrbitSnapshot);

    const multihostOrbitV221: SystemSceneMultihostPlanetRenderBindingV221 | undefined =
      formed === null
        ? undefined
        : Object.freeze({
            hostId: formed.hostId,
            orbitalPeriodDays: formed.periodDays,
            motionId,
            translationState: 'ACTIVE' as const,
          });

    // All components are prepared off-snapshot: malformed formed worlds are
    // discarded as a unit, never displayed without a matching guide/motion.
    if (multihostOrbitV221 !== undefined &&
      !isSystemSceneMultihostPlanetRenderBindingV221(
        multihostOrbitV221, orbit.motionId === motion.id,
        motion.id === contribution.motionId, contributions.length,
      )) continue;

    const body: SystemSceneBodySnapshot = Object.freeze({
      id: candidate.id,
      kind: 'planet' as const,
      label: formed === null ? `${candidate.hostId} · ${candidate.ordinal} (QA)` : formed.designation,
      title: formed === null
        ? `Órbita testigo V2 ${candidate.hostId}/${candidate.ordinal}; giro y velocidad de pantalla no físicos, sin Ground Truth`
        : `Planeta formado V2.2 · anfitrión ${candidate.hostId} · masa ${formed.massEarth.toPrecision(4)} M⊕ · a ${candidate.semiMajorAxisAu.toPrecision(4)} UA. V2.2.1 garantiza órbita y traslación visibles; lunas mostradas en laboratorio son presentación QA, no formación lunar científica.`,
      colorHex: formed === null
        ? hostColor(candidate.hostId)
        : formed.bulkType === 'ICY'
          ? '#ACD9F0'
          : formed.bulkType === 'GAS_ENVELOPE'
            ? '#D9B48B'
            : hostColor(candidate.hostId),
      radiusScene: formed === null
        ? 0.039
        : Math.max(0.027, Math.min(0.081, 0.026 + 0.012 * Math.log2(1 + formed.radiusEarth))),
      position: projectSystemSceneMotionContributions(
        contributions,
        id => id === motionId ? motion : motions.find(entry => entry.id === id),
        base.simulation.epochSimulationDay,
        base.scale,
      ),
      orbitId,
      motionContributions: contributions,
      ...(multihostOrbitV221 === undefined ? {} : { multihostOrbitV221 }),
      surfaceStyle: formed === null
        ? 'rocky' as const
        : formed.bulkType === 'ICY'
          ? 'icy' as const
          : formed.bulkType === 'GAS_ENVELOPE'
            ? 'gaseous' as const
            : 'rocky' as const,
      lightIntensity: 0,
      sourceLuminositySolar: null,
      spin: Object.freeze({
        source: formed === null ? 'QA_PREVIEW_V2' as const : 'V2_2_FORMED' as const,
        rotationPeriodHours: formed === null ? null : formed.rotationPeriodHours,
        axialTiltDegrees: null,
        isRetrograde: null,
        isSynchronized: false,
        epochPhaseDegrees: candidate.epochMeanAnomalyDegrees,
      }),
      surfaceEnvironment: null,
      giantAtmosphere: null,
      specialPresentation: null,
    });
    if (![body.position.x, body.position.y, body.position.z]
      .every(Number.isFinite)) continue;
    motions.push(motion);
    orbits.push(orbit);
    const style = stylesById.get(body.id);
    const scientific = scienceById.get(body.id);
    planets.push(formed !== null && scientific !== undefined
      ? binaryPlanetScientificV241(body, scientific, style, moonSystemByPlanet.get(body.id)) : body);
    if (formed !== null) renderedFormedById.set(body.id, formed);
  }

  if (scientificMoonsV242 !== null && scientificPlanetsV241 !== null) {
    materializeLaboratoryScientificMoonsV242(
      planets, scientificPlanetsV241, scientificMoonsV242, moons, motions, orbits,
      base, budget.globalLaboratoryMoonCap,
    );
  } else if (formedSystem !== null) {
    // Triple / non-binary preview retained bit for bit until multihost triple science.
    materializeLaboratoryMoonsV221(
      planets,
      renderedFormedById,
      moons,
      motions,
      orbits,
      base,
      budget.globalLaboratoryMoonCap,
      MULTIHOST_V221_SECONDS_PER_ORBIT.QA_MOON,
      stylesById,
    );
  }

  const smallBodies = scientificMinorBodiesV243 === null ? null : materializeBinaryScientificMinorBodiesV243(
    scientificMinorBodiesV243, base, stars, hostRadialProjections, motions, orbits,
  );

  // General view contains both complete 4.8-unit SINGLE disks throughout
  // their apastron motion. Local view tracks A/B independently without
  // changing projected AU, HZ, orbital guides or physics. The renderer already consumes
  // this camera-only override, never feeds it back to the AU projection.
  const finalStars = binarySOnly && layoutPlan !== null
    ? Object.freeze(base.stars.map(star => {
        const local = layoutPlan.layout.hostEnvelopes.find(item => item.hostId === star.label);
        const zone = multihostHabitableZonesV23.find(item => item.hostId === star.label);
        return local === undefined ? star : Object.freeze({
          ...star,
          localSystemFocusRadiusScene: Math.max(
            local.outerEnvelopeScene,
            zone?.dynamicallyHabitableOuterRadiusScene ?? 0,
          ) + 0.12,
        });
      }))
    : base.stars;
  const binaryCameraRadius = binarySOnly && layoutPlan !== null
    ? Math.max(2.8, ...base.stars.filter(star =>
        star.label === 'A' || star.label === 'B').map(star => {
          const envelope = layoutPlan.layout.hostEnvelopes.find(item => item.hostId === star.label);
          const excursion = star.motionContributions.reduce((sum, contribution) => {
            const motion = base.motions.find(item => item.id === contribution.motionId);
            if (motion === undefined) return sum;
            return sum + systemSceneProjectedRadiusAuInSpace(
              motion.semiMajorAxisAu * (1 + motion.eccentricity), base.scale,
              contribution.projectionSpace ?? SystemSceneProjectionSpace.GLOBAL,
            ) * Math.abs(contribution.scale * (contribution.postProjectionScale ?? 1));
          }, 0);
          return Math.max(
            Math.hypot(star.position.x, star.position.y, star.position.z), excursion,
          ) + Math.max(
            envelope?.outerEnvelopeScene ?? star.radiusScene,
            multihostHabitableZonesV23.find(zone => zone.hostId === star.label)
              ?.dynamicallyHabitableOuterRadiusScene ?? 0,
          ) + 0.35;
        })) * 1.18
    : undefined;

  const finalLayers = formedSystem === null
    ? base.layers
    : Object.freeze(binarySOnly ? {
        ...base.layers,
        moonCount: moons.length,
        minorBodyCount: smallBodies?.minorBodies.length ?? 0,
        habitableZoneAvailable: multihostHabitableZonesV23.length > 0,
        orbitalRiskTargetCount: 0,
        orbitalCrossingTargetCount: 0,
        orbitalApproachTargetCount: 0,
        orbitalCollisionGeometryTargetCount: 0,
      } : { ...base.layers, moonCount: moons.length });

  return Object.freeze({
    ...base,
    title: `${base.title} · ${formedSystem === null ? 'V2 QA (experimental)' : binarySOnly ? 'V2.4.3 BINARY A/B · planetas, lunas y menores científicos' : 'V2.2.3 multihost hierarchical layout'}`,
    accessibleLabel: formedSystem === null
      ? `V2 experimental superpuesta a ${base.planets.length} planetas reales V1, ${base.moons.length} lunas V1 y ${planets.length - base.planets.length} testigos V2. Candidatos sin Ground Truth.`
      : binarySOnly
        ? `BINARY V2.4.3 laboratorio: ${scientificPlanetsV241?.planets.length ?? 0} planetas con masa/radio/órbita V2.2, clasificación V1 de bulk, radios visuales idénticos al algoritmo SINGLE y variedad de aspectos radiativos HIPOTÉTICOS. V2.2 sigue fijando los planetas; composición V2 estimada y envoltura gigante VISUAL sin química medida. Atmósferas, clima y agua son modelos V2 estimados a partir de inventarios; no representan mediciones ni ejecutan el agregado Atmosphere V1. ${scientificMoonsV242?.systems.reduce((sum, system) => sum + system.estimatedTotalMoonCount, 0) ?? 0} lunas estimadas de población total, ${scientificMoonsV242?.moons.length ?? 0} relevantes V2.4.2 con órbitas y ${moons.length} visibles (Hill/Roche/Kepler y modelos de referencia, no fase 21 V1), ${scientificMinorBodiesV243?.hosts.reduce((sum, item) => sum + item.estimatedAsteroidPopulation, 0) ?? 0} asteroides de población estimada, ${scientificMinorBodiesV243?.bodies.length ?? 0} menores relevantes con órbitas y ${smallBodies?.minorBodies.length ?? 0} visibles, ${scientificMinorBodiesV243?.belts.length ?? 0} cinturones físicos de referencia en A/B; ${scientificMinorBodiesV243?.hosts.filter(host => host.cometReservoir !== null).length ?? 0} reservorios cometarios fríos S-type y ${scientificMinorBodiesV243?.bodies.filter(body => body.cometOrbitClass === 'INBOUND_VISITOR').length ?? 0} visitantes con órbitas excéntricas de referencia (sin N-body, circumbinarios ni persistencia); no se simula irradiación variable de compañera.`
        : `V2.2.3: ${formedSystem.planets.length} planetas formados en el agregado; ${planets.length - base.planets.length} planetas V2.2 renderizados con órbita y traslación completas dentro del límite visual ${budget.globalPlanetCap}; ${moons.length - base.moons.length} lunas QA de laboratorio. La presentación separa sistemas S locales y capas P compartidas, manteniendo HZ y cuerpos menores V1 coherentes.`,
    stars: finalStars,
    planets: Object.freeze(planets),
    // Preserve V1 source-array identity when no formed V2 bodies are present.
    moons: formedSystem === null ? base.moons : Object.freeze(moons),
    minorBodies: binarySOnly ? smallBodies?.minorBodies ?? Object.freeze([]) : base.minorBodies,
    asteroidBelts: binarySOnly ? smallBodies?.asteroidBelts ?? Object.freeze([]) : base.asteroidBelts,
    habitableZone: binarySOnly ? null : base.habitableZone,
    ...(binarySOnly ? {
      multihostHabitableZonesV23: Object.freeze(multihostHabitableZonesV23),
    } : {}),
    hostVisualEnvelope: base.hostVisualEnvelope,
    multistellarPresentation: base.multistellarPresentation,
    multistellarPTypeClearance: base.multistellarPTypeClearance,
    multistellarCoreCompaction: base.multistellarCoreCompaction,
    stellarOrbitClearance: base.stellarOrbitClearance,
    firstOrbitAnchor: base.firstOrbitAnchor,
    orbitalRiskTargets: binarySOnly ? Object.freeze([]) : base.orbitalRiskTargets,
    layers: finalLayers,
    ...(binaryCameraRadius === undefined ? {} : {
      laboratoryFrameRadiusSceneV224: binaryCameraRadius,
    }),
    orbits: Object.freeze(orbits),
    motions: Object.freeze(motions),
    experimentalMultihostCatalog: catalog,
    ...(layoutPlan === null ? {} : { multihostLayoutV222: layoutPlan.layout }),
    ...(formedSystem === null ? {} : { formedMultihostSystemV22: formedSystem }),
    ...(scientificPlanetsV241 === null ? {} : { scientificMultihostPlanetsV241: scientificPlanetsV241 }),
    ...(scientificMoonsV242 === null ? {} : { scientificMultihostMoonsV242: scientificMoonsV242 }),
    ...(scientificMinorBodiesV243 === null ? {} : { scientificMultihostMinorBodiesV243: scientificMinorBodiesV243 }),
  });
}

function buildQaLocalLinearProjectionByHost(
  bodies: readonly { readonly hostId: MultihostOrbitalHostId; readonly periapsisAu: number }[],
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
): Map<string, number> {
  const localLinearByHost = new Map<string, number>();
  for (const host of ['A', 'B', 'C'] as const) {
    const star = stars.get(host);
    const first = bodies.find(candidate => candidate.hostId === host);
    if (star === undefined || first === undefined) continue;
    const space = snapshot.multiplicityName === 'TRIPLE'
      ? SystemSceneProjectionSpace.TRIPLE_LOCAL
      : SystemSceneProjectionSpace.GLOBAL;
    const original = systemSceneProjectedRadiusAuInSpace(first.periapsisAu, snapshot.scale, space);
    const visiblePeriapsis = Math.max(original, star.radiusScene + 0.18);
    localLinearByHost.set(host, visiblePeriapsis / first.periapsisAu);
  }
  return localLinearByHost;
}

/** Round-robin the V2 scientific moon catalogue across visible planets.
 * Render budget does not feed into scientific moon counts or the per-host disk. */
function materializeLaboratoryScientificMoonsV242(
  planets: readonly SystemSceneBodySnapshot[],
  scientificPlanets: MultihostScientificPlanetCatalogV241,
  catalog: MultihostScientificMoonCatalogV242,
  moons: SystemSceneMoonSnapshot[],
  motions: SystemSceneOrbitalMotionSnapshot[],
  orbits: SystemSceneOrbitSnapshot[],
  snapshot: SystemSceneSnapshot,
  moonCap: number,
): void {
  const scienceById = new Map(scientificPlanets.planets.map(item => [item.id, item]));
  const moonGroups = new Map(catalog.systems.map(item => [item.hostPlanetId, item.moons]));
  const selected = planets.filter(planet => scienceById.has(planet.id));
  const maxPerPlanet = Math.max(0, ...selected.map(planet => moonGroups.get(planet.id)?.length ?? 0));
  for (let index = 0; index < maxPerPlanet && moons.length < moonCap; index++) {
    for (const parent of selected) {
      if (moons.length >= moonCap) break;
      const science = scienceById.get(parent.id);
      const moon = moonGroups.get(parent.id)?.[index];
      if (science === undefined || moon === undefined) continue;
      const rendered = projectMultihostScientificMoonV242(moon, parent, science, snapshot, motions);
      motions.push(rendered.motion);
      orbits.push(rendered.orbit);
      moons.push(rendered.body);
    }
  }
}

function materializeLaboratoryMoonsV221(
  planets: readonly SystemSceneBodySnapshot[],
  formedById: ReadonlyMap<string, MultihostFormedPlanetV22>,
  moons: SystemSceneMoonSnapshot[],
  motions: SystemSceneOrbitalMotionSnapshot[],
  orbits: SystemSceneOrbitSnapshot[],
  snapshot: SystemSceneSnapshot,
  moonCap: number,
  _targetSecondsPerOrbit: number,
  stylesById: ReadonlyMap<string, BinaryEcosystemV23['planets'][number]>,
): void {
  let count = 0;
  // Round-robin: first satellites around distinct planets, then extra moons.
  for (let index = 0; index < 3 && count < moonCap; index++) {
    for (const planet of planets) {
      if (count >= moonCap) break;
      const formed = formedById.get(planet.id);
      if (formed === undefined || planet.multihostOrbitV221 === undefined ||
          (stylesById.get(planet.id)?.tentativeMoonCount ?? 0) <= index) continue;
      const proxy = createMultihostPreviewMoonV221(formed, planet, snapshot, motions, index);
      if (proxy === null) continue;
      motions.push(proxy.motion);
      orbits.push(proxy.orbit);
      moons.push(proxy.body);
      count++;
    }
  }
}

function hostAnchor(
  host: MultihostOrbitalHostId,
  snapshot: SystemSceneSnapshot,
  stars: ReadonlyMap<string, SystemSceneBodySnapshot>,
): readonly SystemSceneMotionContributionSnapshot[] | null {
  if (host === 'ABC' || (host === 'AB' && snapshot.multiplicityName === 'BINARY')) {
    return Object.freeze([]);
  }
  if (host === 'AB') {
    const primary = stars.get('A');
    return primary === undefined
      ? null
      : Object.freeze(
          primary.motionContributions.filter(contribution =>
            contribution.projectionSpace === SystemSceneProjectionSpace.TRIPLE_OUTER),
        );
  }
  const star = stars.get(host);
  return star === undefined ? null : star.motionContributions;
}

function hostColor(host: MultihostOrbitalHostId): string {
  switch (host) {
    case 'A': return '#65C4EC';
    case 'B': return '#DDACFA';
    case 'C': return '#F6BC76';
    case 'AB': return '#7BDCB3';
    case 'ABC': return '#F6D97E';
  }
}

/** Physical periods stay frozen; only the laboratory sampling cadence changes. */
export function laboratoryOrbitalTimeScale(
  physicalPeriodDays: number,
  playbackDaysPerRealSecond: number,
  targetRealSecondsPerOrbit: number,
): number {
  if (
    !(Number.isFinite(physicalPeriodDays) && physicalPeriodDays > 0) ||
    !(Number.isFinite(playbackDaysPerRealSecond) && playbackDaysPerRealSecond > 0) ||
    !(Number.isFinite(targetRealSecondsPerOrbit) && targetRealSecondsPerOrbit > 0)
  ) {
    throw new RangeError('V2 laboratory orbital playback requires positive finite periods and clock.');
  }
  return multihostPresentationTimeScaleV221(
    physicalPeriodDays,
    playbackDaysPerRealSecond,
    targetRealSecondsPerOrbit,
  );
}
