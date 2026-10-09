import { CompactMergerCanonicalEvent } from '../../../../domain/transient/compact-merger-canonical-event';
import { CompactMergerStellarLineageStage } from '../../../../domain/transient/compact-merger-stellar-lineage';
import { StellarSystemComponentLabel } from '../../../../domain/stellar/stellar-system-component-label';
import {
  TransientFollowUpFamily as Family, TransientFollowUpOrigin as Origin,
  TransientObservationSignature as Signature,
  type TransientFollowUpInput,
} from '../../../../domain/transient/transient-follow-up-profile';
import { TransientFollowUpEngine } from '../../../../simulation/transient/transient-follow-up-engine';
import { TransientFollowUpAdapters } from '../../../../simulation/transient/transient-follow-up-adapters';
import { NOVA_LABORATORY_CASES } from '../novae/nova-laboratory-fixtures';
import { KILONOVA_LABORATORY_CASES } from '../kilonovae/kilonova-laboratory-fixtures';
import { COMPACT_MERGER_LABORATORY_CASES } from '../compact-mergers/compact-merger-laboratory-fixtures';
import { GAMMA_RAY_BURST_LABORATORY_CASES, GammaRayBurstLaboratoryCaseId } from '../gamma-ray-bursts/gamma-ray-burst-laboratory-fixtures';
import { FAST_RADIO_BURST_LABORATORY_CASES, FastRadioBurstLaboratoryCaseId } from '../fast-radio-bursts/fast-radio-burst-laboratory-fixtures';
import { GREAT_STELLAR_FLARE_LABORATORY_CASES, GreatStellarFlareLaboratoryCaseId } from '../great-stellar-flares/great-stellar-flare-laboratory-fixtures';
import { TIDAL_DISRUPTION_LABORATORY_CASES, TidalDisruptionLaboratoryCaseId } from '../tidal-disruptions/tidal-disruption-laboratory-fixtures';

export interface TransientFollowUpLaboratoryCase {
  readonly id: string;
  readonly buttonLabel: string;
  readonly title: string;
  readonly description: string;
  readonly explanation: string;
  readonly input: TransientFollowUpInput;
  readonly assessment: ReturnType<typeof TransientFollowUpEngine.characterize>;
}
function lab(id: string, buttonLabel: string, title: string, description: string, explanation: string, input: TransientFollowUpInput): TransientFollowUpLaboratoryCase {
  return Object.freeze({ id, buttonLabel, title, description, explanation, input, assessment: TransientFollowUpEngine.characterize(input) });
}
const nova = NOVA_LABORATORY_CASES[0].profile;
const kilonova = KILONOVA_LABORATORY_CASES[0].profile;
const mergerProfile = COMPACT_MERGER_LABORATORY_CASES[0].profile;
/** An explicit laboratory canonical object; never persisted into a user's galaxy. */
const futureMerger = new CompactMergerCanonicalEvent(
  StellarSystemComponentLabel.A, StellarSystemComponentLabel.B,
  'Laboratorio A', 'Laboratorio B',
  CompactMergerStellarLineageStage.FUTURE_NS_NS_MERGER,
  5, mergerProfile.progenitor.referenceInspiralYears,
  5 + mergerProfile.progenitor.referenceInspiralYears / 1e9, mergerProfile,
);
const grb = GAMMA_RAY_BURST_LABORATORY_CASES.find(item => item.id === GammaRayBurstLaboratoryCaseId.LONG_COLLAPSAR_ON_AXIS)!.profile;
const frb = FAST_RADIO_BURST_LABORATORY_CASES.find(item => item.id === FastRadioBurstLaboratoryCaseId.MAGNETAR_REPEATER)!.profile;
const flare = GREAT_STELLAR_FLARE_LABORATORY_CASES.find(item => item.id === GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE)!.profile;
const statistics = GREAT_STELLAR_FLARE_LABORATORY_CASES.find(item => item.id === GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY)!.profile;
const tde = TIDAL_DISRUPTION_LABORATORY_CASES.find(item => item.id === TidalDisruptionLaboratoryCaseId.SOLAR_SMBH)!.profile;

export const TRANSIENT_FOLLOW_UP_LABORATORY_CASES: readonly TransientFollowUpLaboratoryCase[] = Object.freeze([
  lab('nova', 'Nova', 'Nova · cronología física 29.2',
    'Los hitos pertenecen al modelo de la nova; no son fotometría obtenida por un observador.',
    'Se proyectan ascenso, pico, declive, transición nebular y quiescencia desde el perfil real 29.2.',
    TransientFollowUpAdapters.nova('LAB:NOVA:29.2', nova)),
  lab('kilonova', 'Kilonova', 'Kilonova · dos picos intrínsecos 29.3',
    'El pico azul precede al rojo. Sin medidas independientes no se declara detección de la contraparte.',
    'Se conservan las dos escalas temporales explícitas del motor 29.3, no una curva instrumental.',
    TransientFollowUpAdapters.kilonova('LAB:KILONOVA:29.3', kilonova)),
  lab('future-merger', 'Fusión futura', 'Fusión compacta · evento futuro 29.4',
    'Proyección canónica de laboratorio con edad futura; no se sitúa en una fecha terrestre ni se afirma que ya ocurrió.',
    'Ni una fusión futura ni la predicción de chirp equivalen a una observación GW o una kilonova detectada.',
    TransientFollowUpAdapters.futureCompactMerger(futureMerger)),
  lab('tde', 'TDE', 'Disrupción de marea · referencia de fallback',
    'La primera materia ligada retorna en tₘᵢₙ. No es el momento de un pico luminoso observado.',
    'El radio/pericentro y fallback de 29.6 no determinan una curva de luz ni una fecha observacional.',
    TransientFollowUpAdapters.tidalDisruption('LAB:TDE:29.6', tde)),
  lab('grb', 'GRB largo', 'GRB largo · actividad del motor y breakout',
    'La cronología física describe motor y ruptura estelar; no deriva T90, fluencia ni luz prompt.',
    'Solo el jet explícito de 29.7 autoriza los hitos del motor y breakout. Sin jet no existiría esta cronología.',
    TransientFollowUpAdapters.gammaRayBurst('LAB:GRB:29.7', grb)),
  lab('frb', 'FRB repetidor', 'FRB · un burst sin periodo inventado',
    'Hay repetición confirmada en el perfil, pero solo está resuelta la duración de un burst intrínseco.',
    'No se crean fechas para otros bursts ni se usa DM como distancia o tiempo intrínseco.',
    TransientFollowUpAdapters.fastRadioBurst('LAB:FRB:29.8', frb)),
  lab('flare', 'Superflare', 'Llamarada · duración explícita 29.9',
    'La energía y duración de una llamarada individual existen; la tasa estadística no produce próxima fecha.',
    'No se calcula automáticamente pico de brillo, dosis planetaria o CME.',
    TransientFollowUpAdapters.greatStellarFlare('LAB:FLARE:29.9', flare)),
  lab('statistics', 'Sin evento', 'Actividad estadística · sin cronología 29.9',
    'Solo conocemos tasa de flares y energías estadísticas, sin una llamarada individual.',
    'No hay hitos. La falta de cronología no es una observación negativa.',
    TransientFollowUpAdapters.greatStellarFlare('LAB:STATISTICS:29.9', statistics)),
  lab('optical', 'Candidato óptico', 'Señal óptica genérica · clasificación ambigua',
    'Dos observaciones instrumentales explícitas de laboratorio. Sin espectro discriminante no se selecciona progenitor.',
    'Los tiempos están referidos al observador. No se alinean con el marco de la fuente sin redshift/época.',
    {
      id: 'LAB:OBS:OPTICAL', family: Family.UNKNOWN, origin: Origin.OBSERVATIONAL_CANDIDATE,
      forecastDelayYears: null, modelMilestones: [],
      observations: [
        { id: 'opt0', timeAfterObserverReferenceSeconds: 0, label: 'Primer brillo óptico · dato ilustrativo', signature: Signature.OPTICAL_BRIGHTENING },
        { id: 'opt1', timeAfterObserverReferenceSeconds: 86400, label: 'Segundo brillo óptico · dato ilustrativo', signature: Signature.OPTICAL_BRIGHTENING },
      ],
    }),
  lab('multimessenger', 'Multimensajero', 'Coincidencia ilustrativa GW + contraparte cromática',
    'Se suministran ambas señales instrumentalmente en este fixture, no se crean desde un progenitor supuesto.',
    'Los datos son una hipótesis de observación explícita. No se asignan automáticamente GRB, FRB, masa remanente o kilonova canónica.',
    {
      id: 'LAB:OBS:MULTI', family: Family.UNKNOWN, origin: Origin.OBSERVATIONAL_CANDIDATE,
      forecastDelayYears: null, modelMilestones: [],
      observations: [
        { id: 'gw', timeAfterObserverReferenceSeconds: 0, label: 'Chirp GW instrumental · dato ilustrativo', signature: Signature.GW_CHIRP },
        { id: 'opt', timeAfterObserverReferenceSeconds: 7200, label: 'Evolución azul/roja · dato ilustrativo', signature: Signature.RED_BLUE_KILONOVA },
      ],
    }),
  lab('sn-spectrum', 'Espectro SN', 'Espectro compatible con supernova · sin Ground Truth nuevo',
    'El espectro está declarado en el fixture como evidencia externa, no se deriva del tipo del progenitor.',
    'Una compatibilidad espectroscópica no crea una explosión adicional ni cambia la clasificación persistida 29.1.',
    {
      id: 'LAB:OBS:SN', family: Family.UNKNOWN, origin: Origin.OBSERVATIONAL_CANDIDATE,
      forecastDelayYears: null, modelMilestones: [],
      observations: [
        { id: 'spectrum', timeAfterObserverReferenceSeconds: 0, label: 'Espectro de supernova · dato ilustrativo', signature: Signature.SUPERNOVA_SPECTRUM },
      ],
    }),
]);
