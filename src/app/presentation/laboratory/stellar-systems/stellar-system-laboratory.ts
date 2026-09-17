import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';

import {
  DiscoveryState,
} from '../../../domain/discovery/discovery-state';

import {
  assessMultihostOrbitalDomainsV21,
} from '../../../simulation/planetary/multihost-orbital-domain-assessor';


import {
  RouterLink,
} from '@angular/router';

import {
  StellarSystemProceduralRender,
} from '../../genesis-archive/stellar-system-procedural-render';

import {
  SystemScene,
} from '../../system/system-scene';

import {
  SystemSceneSnapshotBuilder,
  type SystemSceneSnapshot,
} from '../../system/system-scene-snapshot';

import { type MultihostScientificPlanetV241 } from '../../../domain/planetary/multihost-scientific-planet-v241';

import {
  STELLAR_SYSTEM_LABORATORY_CASES,
  StellarSystemLaboratoryCaseId,
  StellarSystemLaboratoryFamilyId,
  StellarSystemLaboratoryFixtures,
  type StellarSystemLaboratoryCase,
} from './stellar-system-laboratory-fixtures';

@Component({
  selector:
    'app-stellar-system-laboratory',

  standalone:
    true,

  imports: [
    RouterLink,
    StellarSystemProceduralRender,
    SystemScene,
  ],

  templateUrl:
    './stellar-system-laboratory.html',

  styleUrl:
    './stellar-system-laboratory.scss',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class StellarSystemLaboratoryPage {

  readonly cases =
    STELLAR_SYSTEM_LABORATORY_CASES;

  readonly selectedCaseId =
    signal<StellarSystemLaboratoryCaseId>(
      StellarSystemLaboratoryCaseId.SINGLE,
    );

  readonly selectedFamilyId =
    signal<StellarSystemLaboratoryFamilyId>(
      StellarSystemLaboratoryFamilyId.A,
    );

  readonly selectedCase =
    computed<StellarSystemLaboratoryCase>(
      () =>
        this.cases
          .find(
            candidate =>
              candidate.id ===
              this.selectedCaseId(),
          ) ??
        this.cases[0]!,
    );

  readonly families =
    computed(
      () =>
        StellarSystemLaboratoryFixtures
          .families(
            this.selectedCaseId(),
          ),
    );

  readonly frame =
    computed(
      () =>
        StellarSystemLaboratoryFixtures
          .frame(
            this.selectedCaseId(),
            this.selectedFamilyId(),
          ),
    );

  readonly rendererQaStage =
    computed(
      () =>
        this.frame()
          .stages
          .find(
            stage =>
              stage.discoveryState.code ===
              DiscoveryState.CATALOGUED.code,
          ) ??
        this.frame()
          .stages[
            this.frame()
              .stages.length - 1
          ]!,
    );

  /** V2 candidates are isolated QA and never written to a saved universe. */
  readonly experimentalMultihost = signal(false);
  readonly experimentalMultihostFamily = signal<'ALL' | 'S_TYPE' | 'P_TYPE'>('ALL');

  readonly rendererQaSnapshot =
    computed<SystemSceneSnapshot>(
      () => {
        const frame =
          this.frame();

        const previewStage =
          this.rendererQaStage();

        const generationKey =
          StellarSystemLaboratoryFixtures
            .generationKey();

        return SystemSceneSnapshotBuilder
          .buildFromSource({
            universeSeed:
              generationKey
                .universeSeed
                .serialize(),
            generatorVersionCode:
              generationKey
                .generatorVersionCode,
            locator:
              frame.family.locator,
            proceduralIdentity:
              `G${frame.family.locator.galaxyIndex.toString()} / S${frame.family.locator.sectorKey.toString()} / O${frame.family.locator.galacticObjectIndex.toString()}`,
            discoveryState:
              previewStage.discoveryState,
            discoveryStateLabel:
              previewStage.label,
            stellarSystemCard:
              previewStage.card,
            // QA compares with the same complete V1 laboratory system;
            // switching overlays must not suppress real comets or asteroid belts.
            revealMinorBodyGroundTruth:
              true,
            experimentalMultihostPreview:
              this.experimentalMultihost(),
            experimentalMultihostFamily: this.experimentalMultihostFamily(),
          });
      },
    );

  /** Scientific metadata is keyed by the new V2 planet identity, never by a
   * V1 BodyLocator. The laboratory only reads this frozen snapshot. */
  readonly scientificPlanetById = computed(() => new Map<string, MultihostScientificPlanetV241>(
    this.rendererQaSnapshot().scientificMultihostPlanetsV241?.planets.map((item: MultihostScientificPlanetV241) => [item.id, item] as const) ?? [],
  ));

  /**
   * V2.1 readonly QA assessment. Even V1 bodies are only linked to their frozen
   * host: we do NOT reclassify V1 stability using a different V2 fit.
   */
  readonly orbitalDomainsV21 = computed(() => {
    const snapshot = this.rendererQaSnapshot();
    const catalog = snapshot.experimentalMultihostCatalog;
    if (catalog === undefined) return null;
    const legacyHostId = snapshot.multiplicityName === 'SINGLE'
      ? 'A' as const : 'AB' as const;
    const previewIds = new Set([
      ...catalog.candidates.map(candidate => candidate.id),
      ...(snapshot.formedMultihostSystemV22?.planets.map(planet => planet.id) ?? []),
    ]);
    return assessMultihostOrbitalDomainsV21({
      catalog,
      legacyHostId,
      legacyPlanets: snapshot.planets
        .filter(planet => !previewIds.has(planet.id))
        .map(planet => ({ id: planet.id, label: planet.label })),
    });
  });

  candidateCount(
    candidates: readonly { readonly hostId: string }[],
    hostId: string,
  ): number {
    return candidates.filter(candidate => candidate.hostId === hostId).length;
  }

  renderedMultihostPlanetCount(hostId?: string): number {
    return this.rendererQaSnapshot().planets.filter(planet =>
      planet.multihostOrbitV221 !== undefined &&
      (hostId === undefined || planet.multihostOrbitV221.hostId === hostId),
    ).length;
  }

  laboratoryMultihostMoonCount(): number {
    return this.rendererQaSnapshot().moons.filter(moon =>
      moon.scientificV242 === true || moon.previewOnlyV221 === true,
    ).length;
  }

  moonCountForHost(hostId: string): number {
    const planets = new Set(this.rendererQaSnapshot().planets.filter(planet =>
      planet.multihostOrbitV221?.hostId === hostId).map(planet => planet.id));
    return this.rendererQaSnapshot().moons.filter(moon =>
      (moon.scientificV242 === true || moon.previewOnlyV221 === true) &&
      planets.has(moon.hostPlanetId)).length;
  }

  /** V2 reference population estimate; only individually modeled relevant
   * moons can be given IDs, physical orbits or visual bodies. */
  estimatedMoonPopulationForHost(hostId: string): number {
    return this.rendererQaSnapshot().scientificMultihostMoonsV242?.systems
      .filter(system => system.hostId === hostId)
      .reduce((count, system) => count + system.estimatedTotalMoonCount, 0) ?? 0;
  }

  /** Individually modeled relevant moons, distinct from 36 visible slots. */
  scientificMoonCountForHost(hostId: string): number {
    return this.rendererQaSnapshot().scientificMultihostMoonsV242?.systems
      .filter(system => system.hostId === hostId)
      .reduce((count, system) => count + system.modeledMoonCount, 0) ?? 0;
  }

  minorCountForHost(hostId: string, kind: 'ASTEROID' | 'COMET'): number {
    return this.rendererQaSnapshot().minorBodies.filter(body =>
      body.previewOnlyV23 && body.hostIdV23 === hostId &&
      body.minorBodyKind.name === kind).length;
  }

  beltCountForHost(hostId: string): number {
    return (this.rendererQaSnapshot().asteroidBelts ?? []).filter(belt =>
      belt.previewOnlyV23 && belt.id.includes(`-${hostId}-belt`)).length;
  }

  selectExperimentalMultihostFamily(family: 'ALL' | 'S_TYPE' | 'P_TYPE'): void {
    this.experimentalMultihostFamily.set(family);
  }

  toggleExperimentalMultihost(): void {
    this.experimentalMultihost.update((enabled: boolean) => !enabled);
  }

  selectCase(
    caseId:
      StellarSystemLaboratoryCaseId,
  ): void {

    // A hidden P-type filter from a previous TRIPLE must not leave the new
    // S-only BINARY laboratory empty. This is QA selection state only.
    this.experimentalMultihostFamily.set('ALL');

    this
      .selectedCaseId
      .set(
        caseId,
      );

    this
      .selectedFamilyId
      .set(
        StellarSystemLaboratoryFamilyId.A,
      );
  }

  selectFamily(
    familyId:
      StellarSystemLaboratoryFamilyId,
  ): void {

    this
      .selectedFamilyId
      .set(
        familyId,
      );
  }
}
