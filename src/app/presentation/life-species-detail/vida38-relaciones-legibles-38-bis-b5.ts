/** 38.bis-b5 — Traducción fiel de las aristas ecológicas VIDA.6 para fichas públicas. */
import type { Vida6EcologicalRelation } from '../../domain/life/vida6-ecosystems-species';

export interface Vida38EcologicalDescriptionB5 {
  readonly text: string;
  readonly relativeIntensity: string;
}

export function describeVida38EcologicalRelationB5(
  relation: Vida6EcologicalRelation,
  speciesId: string,
  nameOf: (id: string) => string,
): Vida38EcologicalDescriptionB5 | null {
  const source = relation.sourceSpeciesId === speciesId;
  const target = relation.targetSpeciesId === speciesId;
  if (!source && !target) return null;
  const other = nameOf(source ? relation.targetSpeciesId : relation.sourceSpeciesId);
  let text: string;
  switch (relation.kind) {
    case 'CONSUMES':
      text = source ? `Consume a ${other}` : `Es consumida por ${other}`;
      break;
    case 'DECOMPOSES':
      text = source ? `Descompone restos orgánicos asociados a ${other}`
        : `Sus restos pueden ser descompuestos por ${other}`;
      break;
    case 'MUTUALISM':
      text = `Mantiene una relación de beneficio mutuo con ${other}`;
      break;
    case 'COMPETES':
      text = `Compite por recursos del mismo hábitat con ${other}`;
      break;
    default:
      return null;
  }
  if (!Number.isFinite(relation.intensity01) ||
      relation.intensity01 < 0 || relation.intensity01 > 1) return null;
  const intensity = relation.intensity01;
  return Object.freeze({text, relativeIntensity: intensity.toLocaleString('es-ES', {
    minimumFractionDigits: 1, maximumFractionDigits: 4,
  })});
}
