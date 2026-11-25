import { ScientificBodyPreviewKind, type ScientificBodyPreviewModel,
  type ScientificPlanetStarLightSourceV1,
} from '../scientific/scientific-body-preview';

/** One light-field contract for planet, moon and combined fiche views. */
export function viscorbPreviewStellarSourcesV1(
  model: ScientificBodyPreviewModel,
): readonly ScientificPlanetStarLightSourceV1[] | undefined {
  if (model.kind === ScientificBodyPreviewKind.PLANET) {
    return model.primary.stellarLightSources ?? model.primary.civilizationStarSources;
  }
  if (model.kind === ScientificBodyPreviewKind.MOON) {
    return model.hostPlanet?.stellarLightSources ??
      model.hostPlanet?.civilizationStarSources ??
      model.primary.stellarLightSources;
  }
  return undefined;
}
