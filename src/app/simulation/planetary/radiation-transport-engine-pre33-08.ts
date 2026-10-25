import type { AtmosphereClosurePRE3306 } from '../../domain/planetary/atmosphere-causal-closure-pre33-06';
import type { MoonRadiationProtection32F3 } from '../../domain/planetary/moon-radiation-protection-32-f-3';
import {
  PRE3308_RADIATION_CONTRACT,
  type RadiationBodyPRE3308, type RadiationColumnPRE3308, type RadiationDosePRE3308,
  type RadiationForcingPRE3308, type RadiationNichePRE3308,
  type RadiationTargetPRE3308, type RadiationWorldPRE3308,
} from '../../domain/planetary/radiation-transport-pre33-08';

const SECONDS_PER_JULIAN_YEAR = 365.25 * 86400;
const G_EARTH = 9.80665;
const VALID_LIMITS = Object.freeze([
  'NO_IONIZING_SPECTRUM_FROM_BOLOMETRIC_FLUX_OR_V1_INDEX',
  'ONE_MEV_PRIMARY_GAMMA_ATTENUATION_IS_NOT_DOSE',
  'PHOTON_SCATTERING_SECONDARIES_REQUIRE_COMPLETE_DOSE_RESPONSE',
  'MAGNETOSPHERIC_PARTICLE_TRANSPORT_NOT_INFERRED_FROM_V1_INDEX',
  'CT0_DOSE_DOES_NOT_ESTABLISH_HISTORICAL_EXPOSURE_OR_BIOLOGICAL_SAFETY',
  'TRANSIENT_EVENTS_NEED_DATED_SOURCED_FLUENCE_NOT_ARBITRARY_STELLAR_EVENTS',
]);
function nonnegative(x: number): boolean { return Number.isFinite(x) && x >= 0; }
function key(k: string | null | undefined): boolean { return typeof k === 'string' && k.trim().length > 0; }
function unknown(niche: RadiationNichePRE3308, reason: string,
  status: RadiationDosePRE3308['status'] = 'UNKNOWN_SOURCE'): RadiationDosePRE3308 {
  return Object.freeze({status, niche, doseGrayPerYear: null, eventDoseGray: null,
    sourceRecordKeys: Object.freeze([]), reason, lifeOrSafetyCertified: false});
}
function uniqueKeys(values: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(values)].sort());
}

/** A complete spectrum AND independently calibrated spectral transport response
 * are mandatory for total absorbed dose. If either is missing, UNKNOWN.
 * CT0 stationary dose in Gy/year; DATED_EVENT returns Gy/event only. */
export class RadiationTransportEnginePRE3308 {
  private constructor() {}

  static dose(source: RadiationForcingPRE3308 | null,
    target: RadiationTargetPRE3308,
    hasSolidSurface = true): RadiationDosePRE3308 {
    if (!key(target.targetRecordKey) || !['SURFACE','SUBSURFACE','ENVELOPE'].includes(target.niche))
      throw new RangeError('PRE-33.08 requires identified target and niche.');
    if (!hasSolidSurface && target.niche === 'SURFACE')
      return unknown(target.niche,'Envoltura profunda: no existe superficie sólida definida.', 'NO_SURFACE_REFERENCE');
    if (!source) return unknown(target.niche,'Falta espectro/flujo ionizante independiente, fotónico y de partículas.');
    if (!key(source.recordKey) || !key(source.geometryRecordKey) ||
        (source.geometryTransmission01 !== null &&
          (!nonnegative(source.geometryTransmission01) || source.geometryTransmission01 > 1)))
      throw new RangeError('PRE-33.08 requires valid independently sourced geometry.');
    if (source.epoch === 'DATED_EVENT' && (!key(source.transientEventId) ||
        !nonnegative(source.durationSeconds ?? Number.NaN)))
      throw new RangeError('PRE-33.08 dated transient requires identifier and duration.');
    if (source.epoch === 'CT0' && source.transientEventId !== null)
      throw new RangeError('PRE-33.08 transient source cannot masquerade as steady CT0.');
    if (source.geometryTransmission01 === null)
      return unknown(target.niche,'Geometría orbital/eclipses y transmisión magnetosférica sin resolver.',
        'UNKNOWN_TRANSPORT');
    const channels = [source.photons,source.particles] as const;
    if (channels.some(ch => ch.state === 'UNKNOWN' || !ch.spectralCoverageComplete))
      return unknown(target.niche,'Espectro fotónico o de partículas incompleto: NO se deduce de bolométrica ni de 1 MeV.');
    for (const ch of channels) {
      if (ch.state === 'INDEPENDENT_ABSENCE') {
        if (!key(ch.sourceRecordKey) || ch.bands.length !== 0)
          throw new RangeError('PRE-33.08 independently absent channel needs zero bands and evidence.');
      } else if (ch.state === 'QUANTIFIED_SPECTRUM') {
        if (!key(ch.sourceRecordKey) || ch.bands.length === 0)
          throw new RangeError('PRE-33.08 complete quantified spectrum requires records and bands.');
      } else throw new RangeError('PRE-33.08 invalid channel state.');
    }
    if (!target.columnProfileComplete || !key(target.responseRecordKey) ||
        target.columnProfile.length === 0)
      return unknown(target.niche,'Columna material/objetivo o respuesta de transporte incompletos.',
        'UNKNOWN_TRANSPORT');
    for (const layer of target.columnProfile) {
      if (!nonnegative(layer.kilogramsPerSquareMeter) || !key(layer.sourceRecordKey))
        throw new RangeError('PRE-33.08 invalid shield column.');
    }
    let doseRateGyPerSecond = 0;
    const keys: string[] = [source.recordKey,source.geometryRecordKey,target.targetRecordKey,
      target.responseRecordKey!,...target.columnProfile.map(x=>x.sourceRecordKey)];
    for (const [index,ch] of channels.entries()) {
      keys.push(ch.sourceRecordKey!);
      if (ch.state === 'INDEPENDENT_ABSENCE') continue;
      const channel = index === 0 ? 'PHOTON' : 'PARTICLE';
      const seen = new Set<number>();
      for (const band of ch.bands) {
        if (!Number.isFinite(band.energyMeV) || band.energyMeV <= 0 ||
            !nonnegative(band.energyFluxWattsPerSquareMeter) || !key(band.sourceRecordKey) ||
            seen.has(band.energyMeV))
          throw new RangeError('PRE-33.08 invalid or duplicated spectral band.');
        seen.add(band.energyMeV);
        const response = target.responses.filter(r => r.channel === channel &&
          r.energyMeV === band.energyMeV);
        if (response.length !== 1 || !key(response[0].sourceRecordKey) ||
            !nonnegative(response[0].grayPerJoulePerSquareMeter) ||
            response[0].includesSecondaryAndScattered !== true)
          return unknown(target.niche,'No existe respuesta dosimétrica COMPLETA por banda/canal, incluidos secundarios.',
            'UNKNOWN_TRANSPORT');
        keys.push(band.sourceRecordKey,response[0].sourceRecordKey);
        doseRateGyPerSecond += band.energyFluxWattsPerSquareMeter *
          response[0].grayPerJoulePerSquareMeter * source.geometryTransmission01;
      }
    }
    if (!nonnegative(doseRateGyPerSecond)) throw new RangeError('PRE-33.08 dose overflow.');
    const event = source.epoch === 'DATED_EVENT';
    const dose = event ? doseRateGyPerSecond * source.durationSeconds! :
      doseRateGyPerSecond * SECONDS_PER_JULIAN_YEAR;
    if (!nonnegative(dose)) throw new RangeError('PRE-33.08 integrated dose overflow.');
    return Object.freeze({status:event?'MODELLED_TRANSIENT_EVENT':'MODELLED_CT0_DOSE', niche:target.niche,
      doseGrayPerYear:event?null:dose, eventDoseGray:event?dose:null,
      sourceRecordKeys:uniqueKeys(keys), reason:event
        ? 'Dosis del episodio fechado; no extrapolable automáticamente a Gy/año.'
        : 'Dosis CT-0 de fuente y respuesta espectral completas; no garantiza seguridad biológica.',
      lifeOrSafetyCertified:false});
  }

  /** Project the existing source-separated CT0 truth without inventing EUV,
   * X-rays, spectral particle forcing, dosimetric cross sections or magnetosphere.
   * The 1 MeV reference is displayed ONLY as direct photon transmission. */
  static world(input: Readonly<{
    bodyKind: RadiationBodyPRE3308;
    hasSolidSurface: boolean;
    surfaceGravityEarth: number;
    atmosphericClosure: AtmosphereClosurePRE3306 | null;
    lunarReference?: MoonRadiationProtection32F3 | null;
    /** Optional complete independently quantified forcing, not inferred from V1/32.F.3. */
    forcing?: RadiationForcingPRE3308 | null;
    /** Independently calibrated channel responses for each niche, when available. */
    targets?: Partial<Record<RadiationNichePRE3308, RadiationTargetPRE3308>>;
  }>): RadiationWorldPRE3308 {
    if (input.forcing?.epoch === 'DATED_EVENT')
      throw new RangeError('PRE-33.08 CT0 projection cannot convert a transient into annual dose.');
    if (!Number.isFinite(input.surfaceGravityEarth) || input.surfaceGravityEarth <= 0)
      throw new RangeError('PRE-33.08 requires positive gravity.');
    const atm = input.atmosphericClosure;
    let atmosphereColumn: RadiationColumnPRE3308 | null = null;
    if (atm?.causalModelPressurePascal !== null &&
        atm?.causalModelPressurePascal !== undefined && input.hasSolidSurface &&
        nonnegative(atm.causalModelPressurePascal) && key(atm.inventorySourceId) &&
        key(atm.exobaseSourceId)) {
      atmosphereColumn = Object.freeze({material:'GAS' as const,
        kilogramsPerSquareMeter:atm.causalModelPressurePascal/(input.surfaceGravityEarth*G_EARTH),
        sourceRecordKey:`PRE33.06:${atm.inventorySourceId}:${atm.exobaseSourceId}`,
        provenance:'CT0_CONSTITUTIVE' as const});
    }
    const ref = input.bodyKind === 'MOON' ? input.lunarReference : null;
    const ice = ref?.waterCoveringState === 'ICE_COVER_OVER_MODELLED_OCEAN' &&
      nonnegative(ref.iceCoverMassColumnKilogramsPerSquareMeter ?? Number.NaN)
      ? Object.freeze({material:'H2O_ICE' as const,
        kilogramsPerSquareMeter:ref!.iceCoverMassColumnKilogramsPerSquareMeter!,
        sourceRecordKey:`32.F.3:ICE:${ref!.hostPlanetOrdinal}:${ref!.moonOrdinal}`,
        provenance:'CT0_CONSTITUTIVE' as const}) : null;
    const reference = ref?.referenceOneMeVGammaDirectTransmissionToOcean01 ?? null;
    return Object.freeze({contract:PRE3308_RADIATION_CONTRACT,bodyKind:input.bodyKind,
      epoch:'CT0',hasSolidSurface:input.hasSolidSurface,
      stellarBolometricIsIonizingSource:false,
      photonSource:input.forcing?.photons.state==='QUANTIFIED_SPECTRUM'?'QUANTIFIED':
        input.forcing?.photons.state==='INDEPENDENT_ABSENCE'?'INDEPENDENT_ABSENCE':'UNRESOLVED',
      particleSource:input.forcing?.particles.state==='QUANTIFIED_SPECTRUM'?'QUANTIFIED':
        input.forcing?.particles.state==='INDEPENDENT_ABSENCE'?'INDEPENDENT_ABSENCE':'UNRESOLVED',
      magneticParticleTransmission01:null,atmosphereColumn,oceanIceColumn:ice,
      gammaOneMeVReferenceDirectTransmission01:reference,
      surface:input.targets?.SURFACE
        ? this.dose(input.forcing??null,input.targets.SURFACE,input.hasSolidSurface)
        : unknown('SURFACE',input.hasSolidSurface
          ? 'No hay espectro ionizante/partículas y respuesta de dosis total con fuente independiente.'
          : 'No hay superficie sólida accesible bajo la envoltura profunda.',
          input.hasSolidSurface?'UNKNOWN_SOURCE':'NO_SURFACE_REFERENCE'),
      subsurface:input.targets?.SUBSURFACE
        ? this.dose(input.forcing??null,input.targets.SUBSURFACE)
        : unknown('SUBSURFACE',ice!==null
          ? 'Cubierta H₂O identificada; NO hay espectro, dispersión, partículas ni dosimetría independientes.'
          : 'Sin cubierta subsuperficial, fuente energética y respuesta dosimétrica completas.',
          ice!==null?'UNKNOWN_SOURCE':'UNKNOWN_TRANSPORT'),
      envelope:input.targets?.ENVELOPE
        ? this.dose(input.forcing??null,input.targets.ENVELOPE)
        : unknown('ENVELOPE','Sin espectro ionizante y perfil altitudinal P–T–composición/dosimetría completos.'),
      observationallyConfirmed:false, biologyEvaluated:false, scientificLimits:VALID_LIMITS});
  }
}
