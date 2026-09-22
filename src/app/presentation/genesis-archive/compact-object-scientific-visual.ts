/**
 * 27.10 — presentation-only iconography. This is NOT a physical radius or
 * synthetic observation. An accretion disk/jet is drawn only when its existing
 * model explicitly exists; a naked BH cannot acquire one in the renderer.
 */
export type CompactObjectVisualKind =
  | 'BLACK_HOLE'
  | 'NEUTRON_STAR'
  | 'PULSAR'
  | 'MILLISECOND_PULSAR'
  | 'MAGNETAR';

export interface CompactObjectScientificVisual {
  readonly kind: CompactObjectVisualKind;
  readonly label: string;
  readonly hasAccretionDisk: boolean;
  readonly hasRelativisticJets: boolean;
  readonly isIllustration: true;
}

export function compactObjectScientificVisual(
  kind: CompactObjectVisualKind,
  hasAccretionDisk = false,
  hasRelativisticJets = false,
): CompactObjectScientificVisual {
  if (hasRelativisticJets && !hasAccretionDisk) {
    throw new RangeError('27.10 cannot draw jets without a physically supported accretion disk.');
  }
  if (kind !== 'BLACK_HOLE' && (hasAccretionDisk || hasRelativisticJets)) {
    throw new RangeError('27.10 cannot draw an unmodelled neutron-star accretion disk or jet.');
  }
  const labels: Record<CompactObjectVisualKind, string> = {
    BLACK_HOLE: 'Agujero negro · sombra esquemática',
    NEUTRON_STAR: 'Estrella de neutrones · superficie esquemática',
    PULSAR: 'Púlsar candidato del modelo · haces geométricos esquemáticos',
    MILLISECOND_PULSAR: 'Púlsar de milisegundo con reciclaje acreditado · haces geométricos esquemáticos',
    MAGNETAR: 'Magnetar candidato del modelo · líneas de campo esquemáticas',
  };
  return Object.freeze({
    kind,
    label: labels[kind],
    hasAccretionDisk,
    hasRelativisticJets,
    isIllustration: true as const,
  });
}
