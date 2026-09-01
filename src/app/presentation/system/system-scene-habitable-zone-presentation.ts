export interface SystemSceneHabitableZonePresentationInput {
  readonly radiativeInnerAu: number;
  readonly radiativeOuterAu: number;
  readonly dynamicallyHabitableInnerAu: number | null;
  readonly dynamicallyHabitableOuterAu: number | null;
  readonly rawRadiativeInnerScene: number;
  readonly rawRadiativeOuterScene: number;
  readonly hostVisualExtentScene: number;
}

export interface SystemSceneHabitableZonePresentationLayout {
  readonly radiativeInnerScene: number;
  readonly radiativeOuterScene: number;
  readonly dynamicallyHabitableInnerScene: number | null;
  readonly dynamicallyHabitableOuterScene: number | null;
}

const MINIMUM_HOST_CLEARANCE_SCENE = 0.22;
const MINIMUM_RADIATIVE_BAND_WIDTH_SCENE = 0.42;

/**
 * Point-24.7 V2 presentation-only HZ layout.
 *
 * The physical AU edges remain authoritative and are exposed separately in
 * the scene snapshot. This helper only prevents the exaggerated stellar
 * photosphere and point-24.5 compression from making the HZ visually collapse
 * into the star or into a single orbital-looking line.
 */
export function buildSystemSceneHabitableZonePresentationV2(
  input: SystemSceneHabitableZonePresentationInput,
): SystemSceneHabitableZonePresentationLayout {
  assertPositiveFinite(input.radiativeInnerAu, 'radiativeInnerAu');
  assertPositiveFinite(input.radiativeOuterAu, 'radiativeOuterAu');
  assertPositiveFinite(input.rawRadiativeInnerScene, 'rawRadiativeInnerScene');
  assertPositiveFinite(input.rawRadiativeOuterScene, 'rawRadiativeOuterScene');

  if (input.radiativeOuterAu <= input.radiativeInnerAu) {
    throw new RangeError('radiativeOuterAu must exceed radiativeInnerAu.');
  }

  if (input.rawRadiativeOuterScene <= input.rawRadiativeInnerScene) {
    throw new RangeError('rawRadiativeOuterScene must exceed rawRadiativeInnerScene.');
  }

  if (!Number.isFinite(input.hostVisualExtentScene) || input.hostVisualExtentScene < 0) {
    throw new RangeError('hostVisualExtentScene must be finite and non-negative.');
  }

  const minimumInnerScene =
    input.hostVisualExtentScene + MINIMUM_HOST_CLEARANCE_SCENE;

  const radiativeInnerScene =
    Math.max(input.rawRadiativeInnerScene, minimumInnerScene);

  const radiativeOuterScene =
    radiativeInnerScene +
    Math.max(
      input.rawRadiativeOuterScene - input.rawRadiativeInnerScene,
      MINIMUM_RADIATIVE_BAND_WIDTH_SCENE,
    );

  const dynamicPairValid =
    input.dynamicallyHabitableInnerAu !== null &&
    input.dynamicallyHabitableOuterAu !== null;

  if (!dynamicPairValid) {
    return Object.freeze({
      radiativeInnerScene,
      radiativeOuterScene,
      dynamicallyHabitableInnerScene: null,
      dynamicallyHabitableOuterScene: null,
    });
  }

  const dynamicInnerAu = input.dynamicallyHabitableInnerAu!;
  const dynamicOuterAu = input.dynamicallyHabitableOuterAu!;

  if (
    dynamicInnerAu < input.radiativeInnerAu ||
    dynamicOuterAu > input.radiativeOuterAu ||
    dynamicOuterAu <= dynamicInnerAu
  ) {
    throw new RangeError('Dynamic HZ must be a positive-width subset of the radiative HZ.');
  }

  const physicalWidthAu = input.radiativeOuterAu - input.radiativeInnerAu;
  const visualWidthScene = radiativeOuterScene - radiativeInnerScene;

  const mapAuToVisualBand = (valueAu: number): number =>
    radiativeInnerScene +
    ((valueAu - input.radiativeInnerAu) / physicalWidthAu) * visualWidthScene;

  return Object.freeze({
    radiativeInnerScene,
    radiativeOuterScene,
    dynamicallyHabitableInnerScene: mapAuToVisualBand(dynamicInnerAu),
    dynamicallyHabitableOuterScene: mapAuToVisualBand(dynamicOuterAu),
  });
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${label} must be finite and greater than zero: ${value}.`);
  }
}
