import { Planet } from './planet';
import { PlanetarySystemOrbitTopology } from './planetary-system-orbit-topology';
import { StellarPulsar } from '../stellar/stellar-pulsar';
import { StellarSystemMultiplicity } from '../stellar/stellar-system-multiplicity';

/**
 * 27.9 — provenance for an EXISTING canonical planet after core collapse.
 * An external physical-history calculation must establish survival and an
 * actual currently bound orbit. Flags are required inputs, not inferred from
 * a surviving phase-18 planet record or treated as observed discoveries.
 * A second-generation planet needs a post-collapse formation contract not
 * present in phase 17/18: it must not masquerade as a survivor here.
 */
export interface PulsarPlanetSurvivalEvidence {
  readonly origin: 'SURVIVED_CORE_COLLAPSE';
  readonly sourceIdentity: string;
  readonly componentSystemSeedHex: string;
  readonly planetBodySeedHex: string;
  readonly collapseSurvivalEstablished: true;
  readonly presentBoundOrbitEstablished: true;
  readonly orbitVerifiedAtAgeBillionYears: number;
  readonly postCollapseSemiMajorAxisAu: number;
  readonly postCollapseEccentricity: number;
}

/** A read-only layer over the SAME Planet and SAME 27.5 pulsar; no new body. */
export class PulsarPlanet {
  static readonly G = 6.67430e-11;
  static readonly SOLAR_MASS_KG = 1.98847e30;
  static readonly EARTH_MASS_KG = 5.9722e24;
  static readonly EARTH_RADIUS_METRES = 6_371_000;
  static readonly AU_METRES = 149_597_870_700;
  static readonly C = 299_792_458;

  readonly semiMajorAxisAu: number;
  readonly eccentricity: number;
  readonly periastronAu: number;
  readonly apoastronAu: number;
  readonly referenceFluidRocheLimitAu: number;
  readonly postCollapseOrbitalPeriodDays: number;
  readonly edgeOnTimingSemiAmplitudeSeconds: number;
  readonly isotropicEquivalentSpinDownFluxWm2: number;
  readonly survivalEvidence: Readonly<PulsarPlanetSurvivalEvidence>;

  constructor(
    readonly pulsar: StellarPulsar,
    readonly planet: Planet,
    evidence: PulsarPlanetSurvivalEvidence,
  ) {
    if (!(pulsar instanceof StellarPulsar) || !(planet instanceof Planet)) {
      throw new TypeError('27.9 requires an existing pulsar and an existing canonical Planet.');
    }
    const host = planet.hostPlanetarySystem.hostStellarSystem;
    // The legacy planet pipeline freezes orbits for a particular stellar host;
    // do not mistake a circumbinary planet or V2 sibling for a pulsar planet.
    if (host.primaryStar !== pulsar.neutronStar.star ||
        host.multiplicity !== StellarSystemMultiplicity.SINGLE ||
        planet.orbitTopology !== PlanetarySystemOrbitTopology.CIRCUMSTELLAR ||
        !planet.generationKey.equals(pulsar.neutronStar.star.generationKey) ||
        planet.locator.galaxyIndex !== pulsar.neutronStar.star.locator.galaxyIndex ||
        planet.locator.sectorKey !== pulsar.neutronStar.star.locator.sectorKey ||
        planet.locator.galacticObjectIndex !== pulsar.neutronStar.star.locator.galacticObjectIndex) {
      throw new RangeError('27.9 planet must orbit its exact existing SINGLE pulsar component.');
    }
    if (!evidence || evidence.origin !== 'SURVIVED_CORE_COLLAPSE' ||
        evidence.collapseSurvivalEstablished !== true ||
        evidence.presentBoundOrbitEstablished !== true ||
        typeof evidence.sourceIdentity !== 'string' ||
        !/^[A-Za-z0-9:._/-]{1,128}$/.test(evidence.sourceIdentity) ||
        evidence.componentSystemSeedHex !== host.seed.normalizedValue ||
        evidence.planetBodySeedHex !== planet.seed.normalizedValue) {
      throw new RangeError('27.9 requires explicit, identity-matched survival and bound-orbit provenance.');
    }
    const now = pulsar.neutronStar.formationAgeBillionYears +
      pulsar.neutronStar.ageSinceFormationBillionYears;
    if (!Number.isFinite(evidence.orbitVerifiedAtAgeBillionYears) ||
        evidence.orbitVerifiedAtAgeBillionYears < pulsar.neutronStar.formationAgeBillionYears ||
        Math.abs(evidence.orbitVerifiedAtAgeBillionYears - now) > 1e-9) {
      throw new RangeError('The post-collapse bound orbit must be independently established at the current age.');
    }
    const a = evidence.postCollapseSemiMajorAxisAu;
    const e = evidence.postCollapseEccentricity;
    if (!Number.isFinite(a) || a <= 0 || !Number.isFinite(e) || e < 0 || e >= 1 ||
        !Number.isFinite(planet.massEarth) || planet.massEarth <= 0 ||
        !Number.isFinite(planet.radiusEarth) || planet.radiusEarth <= 0) {
      throw new RangeError('Pulsar planet mass, radius and post-collapse bound orbit must be physical.');
    }
    const neutronMassKg = pulsar.neutronStar.massSolar * PulsarPlanet.SOLAR_MASS_KG;
    const planetMassKg = planet.massEarth * PulsarPlanet.EARTH_MASS_KG;
    const aMetres = a * PulsarPlanet.AU_METRES;
    this.semiMajorAxisAu = a;
    this.eccentricity = e;
    this.periastronAu = a * (1 - e);
    this.apoastronAu = a * (1 + e);
    // Approximate fluid Roche limit, not a relativistic tidal-disruption model.
    this.referenceFluidRocheLimitAu = 2.44 * planet.radiusEarth *
      PulsarPlanet.EARTH_RADIUS_METRES * (neutronMassKg / planetMassKg) ** (1 / 3) /
      PulsarPlanet.AU_METRES;
    if (this.periastronAu <= this.referenceFluidRocheLimitAu ||
        this.periastronAu * PulsarPlanet.AU_METRES <= pulsar.neutronStar.radiusKm * 1_000) {
      throw new RangeError('The established post-collapse orbit would cross the approximate tidal or stellar limit.');
    }
    this.postCollapseOrbitalPeriodDays = 2 * Math.PI * Math.sqrt(
      aMetres ** 3 / (PulsarPlanet.G * (neutronMassKg + planetMassKg)),
    ) / 86_400;
    // Edge-on upper-bound reflex light-travel-time reference; not a measured
    // timing residual without a measured inclination and pulsar visibility.
    this.edgeOnTimingSemiAmplitudeSeconds = aMetres * planetMassKg /
      (neutronMassKg + planetMassKg) / PulsarPlanet.C;
    // Irradiation reference only: spin-down power is not necessarily radiated
    // isotropically as heat, hence never a temperature / habitability result.
    this.isotropicEquivalentSpinDownFluxWm2 = pulsar.rotationalEnergyLossWatts /
      (4 * Math.PI * aMetres ** 2);
    if (![this.referenceFluidRocheLimitAu, this.postCollapseOrbitalPeriodDays,
      this.edgeOnTimingSemiAmplitudeSeconds, this.isotropicEquivalentSpinDownFluxWm2]
      .every(value => Number.isFinite(value) && value > 0)) {
      throw new RangeError('27.9 pulsar-planet reference quantities must be finite and positive.');
    }
    this.survivalEvidence = Object.freeze({ ...evidence });
    Object.freeze(this);
  }
}
