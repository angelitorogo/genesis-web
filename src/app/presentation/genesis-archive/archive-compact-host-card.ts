import { DiscoveryState, type DiscoveryStateValue } from '../../domain/discovery/discovery-state';
import { ExtremeType } from '../../domain/galactic-object/extreme-object-type';
import { type CompactHostPlanetarySystem } from '../../domain/planetary/compact-host-planetary-system';
import { type ArchiveStellarSystemCardModel, type ArchiveStellarSystemFactModel } from './archive-stellar-system-card';
import { compactObjectScientificVisual, type CompactObjectVisualKind } from './compact-object-scientific-visual';

const LABELS: Readonly<Record<string,string>> = Object.freeze({
  NEUTRON_STAR: 'Estrella de neutrones', PULSAR: 'Púlsar',
  MILLISECOND_PULSAR: 'Púlsar de milisegundos', MAGNETAR: 'Magnetar',
  STELLAR_MASS_BLACK_HOLE: 'Agujero negro estelar',
});
export function compactHostTypeLabel(type: string): string { return LABELS[type] ?? 'Objeto compacto'; }

/** Replaces, never decorates, the inaccurate legacy stellar card at the same V2 address. */
export function compactHostStellarCard(
  baseline: ArchiveStellarSystemCardModel,
  system: CompactHostPlanetarySystem,
  state: DiscoveryStateValue,
): ArchiveStellarSystemCardModel {
  if (state.code < DiscoveryState.CATALOGUED.code) throw new RangeError('Compact identity is catalogued-only.');
  const host = system.host;
  const isBlackHole = host.type === ExtremeType.STELLAR_MASS_BLACK_HOLE;
  const visualKind: CompactObjectVisualKind = isBlackHole ? 'BLACK_HOLE' : host.type;
  const label = compactHostTypeLabel(host.type);
  const fact = (name: string, value: string): ArchiveStellarSystemFactModel => Object.freeze({ label: name, value });
  const facts: ArchiveStellarSystemFactModel[] = [
    fact('Anfitrión', label),
    fact('Masa actual', `${host.scientificState.massSolar.toLocaleString('es-ES', {maximumFractionDigits:4})} M☉`),
    fact('Régimen actual', host.scientificState.activityRegime),
    fact('Carácter físico', isBlackHole ? 'Sin fotosfera; acreción no acreditada' : 'Objeto compacto; emisión de alta energía no cuantificada'),
  ];
  if (host.scientificState.rotationPeriodSeconds !== null) facts.push(
    fact('Período de rotación', `${host.scientificState.rotationPeriodSeconds.toLocaleString('es-ES', {maximumSignificantDigits:5})} s`));
  if (host.scientificState.surfaceMagneticFieldTesla !== null) facts.push(
    fact('Campo superficial', `${host.scientificState.surfaceMagneticFieldTesla.toExponential(2)} T`));
  facts.push(fact('Planetas', state.code >= DiscoveryState.CONFIRMED.code
    ? `${system.planets.length} modelados (órbitas Kepler/Roche/Hill, no validadas N-body)`
    : 'Inventario no revelado hasta Confirmado'));
  const visual = compactObjectScientificVisual(visualKind);
  return Object.freeze({
    ...baseline,
    summary: `Sistema simple con anfitrión compacto ${label.toLowerCase()}. Modelo de universo snapshot; sin historia estelar inferida.`,
    nextScientificStep: state.code >= DiscoveryState.CONFIRMED.code
      ? 'Caracterizar inventarios atmosféricos y espectros; los escenarios de irradiación no son observaciones.'
      : 'Confirmar el sistema para revelar sus planetas y sus escenarios ambientales.',
    systemFacts: Object.freeze(facts),
    components: Object.freeze([Object.freeze({
      componentLabel: 'A' as const, designation: `${baseline.title} A`,
      proceduralCode: null, spectralType: null,
      evolutionStateLabel: label,
      colorHex: isBlackHole ? '#121921' : '#8ABADF',
      facts: Object.freeze(facts.slice(0, -1)), compactVisual: visual,
    })]),
    orbits: Object.freeze([]),
    circumbinaryFacts: Object.freeze([]),
    habitabilityFacts: Object.freeze([fact('Zona habitable estelar', 'No aplicable: sin fotosfera estelar convencional ni presupuesto radiativo completo')]),
    render: Object.freeze({
      ...baseline.render,
      components: Object.freeze([Object.freeze({
        label: 'A' as const, colorHex: isBlackHole ? '#121921' : '#8ABADF',
        radiusScale: 1, massSolar: host.scientificState.massSolar, compactVisual: visual,
      })]),
      stableHabitableZoneFraction: null, hasStableHabitableZone: false,
    }),
  });
}
