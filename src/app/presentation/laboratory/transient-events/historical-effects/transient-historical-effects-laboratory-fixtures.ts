import {
  type HistoricalTargetBody, type HistoricalTransientEvent,
} from '../../../../domain/transient/transient-historical-effects-profile';
import { TransientHistoricalEffectsEngine } from '../../../../simulation/transient/transient-historical-effects-engine';
import { historicalEventFromStellarFlare } from '../../../../simulation/transient/transient-historical-effects-adapters';
import { GreatStellarFlareSourceProfile, GreatStellarFlareSourceKind as Kind, GreatStellarFlareEventState as State } from '../../../../domain/transient/great-stellar-flare-source-profile';
import { StellarActivityProfile } from '../../../../domain/stellar/stellar-activity-profile';
import { StellarActivityRegime } from '../../../../domain/stellar/stellar-activity-regime';

export interface HistoricalEffectsLaboratoryCase {
  readonly id: string;
  readonly button: string;
  readonly title: string;
  readonly description: string;
  readonly provenance: string;
  readonly target: HistoricalTargetBody;
  readonly events: readonly HistoricalTransientEvent[];
  readonly report: ReturnType<typeof TransientHistoricalEffectsEngine.assess>;
}

const event = (id: string, label: string, family: HistoricalTransientEvent['family'], energy: number | null,
  band: HistoricalTransientEvent['band'], years: number | null, geometry: HistoricalTransientEvent['geometry'] = 'ISOTROPIC_TOTAL',
  duration: number | null = null): HistoricalTransientEvent => ({
  id, label, family, state: 'PAST_INTRINSIC_EXPLICIT', yearsBeforeReference: years,
  photonEnergyJoules: energy, band, geometry, sourceDurationSeconds: duration,
});
const target = (id: string, label: string, kind: 'PLANET'|'MOON', separationAu: number|null,
  effectiveOpticalDepth: number|null, biosphereCharacterized = false): HistoricalTargetBody =>
  ({ id, label, kind, separationAu, effectiveOpticalDepth, biosphereCharacterized });

// This adapter uses a REAL phase-29.9 source contract, but the geometric
// assumption and encounter distance are explicit LABORATORY inputs only.
const mFlareSource = new GreatStellarFlareSourceProfile(
  Kind.ORDINARY_STAR, 'Superflare de enana M · modelo 29.9', 0.3, 0.02,
  new StellarActivityProfile(true, 0.86, StellarActivityRegime.EXTREME, 1.4, 2e25, 3.496e27),
  State.EXPLICIT_LARGE_FLARE, 1e27, 3600,
);
const mFlare = historicalEventFromStellarFlare(mFlareSource,
  { id: 'flare-m', yearsBeforeReference: 0.025, emissionGeometry: 'ISOTROPIC_TOTAL' });

const candidate = (id: string, state: HistoricalTransientEvent['state'], family: HistoricalTransientEvent['family']): HistoricalTransientEvent => ({
  id, label: state === 'STATISTICAL_ONLY' ? 'Actividad estadística sin llamarada' : 'Fusión compacta prevista',
  family, state, yearsBeforeReference: null, photonEnergyJoules: null, band: null,
  geometry: 'UNRESOLVED', sourceDurationSeconds: null,
});
const scenarios: Omit<HistoricalEffectsLaboratoryCase, 'report'>[] = [
  { id: 'm-flare', button: 'Enana M', title: 'Exposición bolométrica de una superflare explícita',
    description: 'Usa el evento real del contrato 29.9; la distancia de 0,1 UA y la emisión isotrópica son hipótesis DECLARADAS del laboratorio. No se descompone la energía en UV ni se calcula una dosis.',
    provenance: 'Adaptador real 29.9 + hipótesis geométrica local',
    target: target('m-planet','Planeta cercano al anfitrión', 'PLANET',0.1,null), events:[mFlare] },
  { id: 'uv-shield', button: 'UV + atmósfera', title: 'Atenuación UV explícita (Beer–Lambert idealizado)',
    description: 'Energía UV, distancia y profundidad óptica τ = 2,5 se proporcionan explícitamente. Se obtiene transmisión energética de esa banda, NO daño del ozono, biología o una química atmosférica.',
    provenance: 'Hipótesis UV instrumental ilustrativa · sin extracción artificial de 29.9',
    target: target('uv-target','Planeta con τ UV explícita','PLANET',0.1,2.5,true),
    events:[event('uv','Impulso UV conocido','STELLAR_FLARE',1e24,'UV',0.007,'ISOTROPIC_TOTAL',720)] },
  { id:'sn-distant', button:'SN distante', title:'Supernova distante · energía bolométrica explícita',
    description:'Una supernova a 70 parsecs del objetivo con energía radiada indicada permite una fluencia geométrica. No se deduce UV/X ni radiactividad o partículas a partir de energía bolométrica.',
    provenance:'Referencia geométrica de laboratorio · no simula un nuevo evento 29.1',
    target:target('sn-target','Planeta distante','PLANET',70 * 206_264.806,null),
    events:[event('sn','Radiación bolométrica SN de referencia','SUPERNOVA',1e42,'BOLOMETRIC',130_000,'ISOTROPIC_TOTAL',1e7)] },
  { id:'beam', button:'GRB · orientación ?', title:'Jet con eje desconocido · no hay fluencia inferible',
    description:'Aunque la energía isotrópica equivalente se proporcione, sin intersección del haz la irradiación del objetivo no puede calcularse.',
    provenance:'Escenario orientacional explícito · no convierte 29.7 en GRB automático',
    target:target('beam-target','Luna dentro de un sistema','MOON',3e7,null),
    events:[event('grb','Jet GRB con orientación sin resolver','GRB',1e44,'GAMMA',200,'BEAM_ORIENTATION_UNKNOWN',2)] },
  { id:'moon', button:'Luna sin aire', title:'Luna sin atmósfera: τ = 0 explícito',
    description:'En el escenario se conoce que la atenuación de esa banda es nula. La radiación superficial no es una dosis biológica ni se presupone biosfera.',
    provenance:'Hipótesis de objetivo lunar sin atenuación · no muta la luna real',
    target:target('moon','Luna sin atmósfera declarada','MOON',1,0),
    events:[event('x-ray','Estallido X explícito','STELLAR_FLARE',1e25,'X_RAY',1000,'ISOTROPIC_TOTAL',100)] },
  { id:'stats', button:'Solo tasa', title:'Una tasa estelar no crea historia de impactos',
    description:'El perfil estadístico de 15.4 no proporciona eventos ni posiciones temporales reales; no se inventan exposiciones históricas.',
    provenance:'Frontera con 15.4 y 29.9',
    target:target('stats-planet','Planeta con actividad estelar','PLANET',1,null),
    events:[candidate('no-event','STATISTICAL_ONLY','STELLAR_FLARE')] },
  { id:'future', button:'Fusión futura', title:'Una fusión canónica futura no irradió en el pasado',
    description:'29.4/29.10 predicen la fusión; no se genera exposición retrospectiva ni altera sistemas que aún no han sido irradiados.',
    provenance:'Frontera de 29.4/29.5/29.10',
    target:target('future-planet','Planeta de sistema compacto','PLANET',1,null),
    events:[candidate('future-merger','FUTURE_CANONICAL','COMPACT_MERGER')] },
  { id:'chronology', button:'Historial parcial', title:'Tres entradas: subtotal conocido ≠ historial completo',
    description:'Solo se suman fluencias de eventos históricos explícitos y de la misma banda. El tercero sigue sin espectro; sus consecuencias no se sustituyen por cero.',
    provenance:'Cronología del escenario, con edades relativas introducidas',
    target:target('history-planet','Planeta con episodios documentados','PLANET',0.7,null),
    events:[event('older','Pulso UV antiguo','STELLAR_FLARE',1e24,'UV',800),
      event('unknown','Episodio sin espectro','SUPERNOVA',null,null,500),
      event('recent','Pulso UV reciente','STELLAR_FLARE',2e24,'UV',200)] },
  { id:'frb', button:'FRB sin E', title:'Un FRB coherente no cuantifica por sí solo exposición energética',
    description:'Duración y frecuencia de 29.8 no implican energía radiada ni fluencia. Sin energía en una banda y distancia no se calcula exposición; ni un FRB implica consecuencias atmosféricas.',
    provenance:'Límite físico de 29.8 · evento sintético no persistido',
    target:target('frb-moon','Luna del sistema receptor','MOON',6,null),
    events:[event('frb-radio','Burst coherente sin E radiada','FRB',null,null,1000,'UNRESOLVED',0.002)] },
  { id:'kilonova', button:'Kilonova sin E', title:'Picos temporales de 29.3 no equivalen a fluencia local',
    description:'Una kilonova puede tener escala temporal azul/roja conocida, pero sin integral radiativa por banda y separación del objetivo no se inventa una irradiación histórica.',
    provenance:'Frontera con 29.3 y 29.10',
    target:target('kn-target','Planeta cercano a binario compacto','PLANET',null,null),
    events:[event('kn','Kilonova con cronología pero sin energía integrada','KILONOVA',null,null,340)] },
  { id:'tde', button:'TDE sin L', title:'Fallback de un TDE no es luminosidad recibida',
    description:'Una ley t^-5/3 de masa ligada de 29.6 no autoriza energía radiada, flujo observado ni irradiación de planetas si no se conoce eficiencia radiativa y espectro.',
    provenance:'Frontera con 29.6 · sin eficiencia radiativa inventada',
    target:target('tde-target','Planeta circunnuclear hipotético','PLANET',5000,null),
    events:[event('tde','Retorno de material sin emisión resuelta','TDE',null,null,12000)] },
  { id:'biosphere', button:'Biosfera ?', title:'Incluso con biosfera caracterizada: la respuesta sigue sin derivar',
    description:'Ni una fluencia UV conocida, ni una atmósfera, ni una posible biosfera permiten inventar mortalidad, extinción, química ni recuperación sin un modelo biológico propio no antropocéntrico.',
    provenance:'Frontera con 29.11 y futuras simulaciones de vida',
    target:target('alien-world','Planeta con biosfera caracterizada','PLANET',0.4,1.0,true),
    events:[event('alien-uv','Evento UV con espectro explícito','STELLAR_FLARE',8e23,'UV',600,'ISOTROPIC_TOTAL',1200)] },
];

export const TRANSIENT_HISTORICAL_EFFECTS_CASES: readonly HistoricalEffectsLaboratoryCase[] = scenarios.map(c =>
  ({...c,report:TransientHistoricalEffectsEngine.assess(c.target,c.events)}));
