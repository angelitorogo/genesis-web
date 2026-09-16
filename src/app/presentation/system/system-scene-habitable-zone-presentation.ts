export interface SystemSceneHabitableZonePresentationInput {
  readonly radiativeInnerAu: number;
  readonly radiativeOuterAu: number;
  readonly dynamicallyHabitableInnerAu: number | null;
  readonly dynamicallyHabitableOuterAu: number | null;
  readonly projectedRadiativeInnerScene: number;
  readonly projectedRadiativeOuterScene: number;
  readonly projectedDynamicallyHabitableInnerScene: number | null;
  readonly projectedDynamicallyHabitableOuterScene: number | null;
}

export interface SystemSceneHabitableZonePresentationLayout {
  readonly radiativeInnerScene: number;
  readonly radiativeOuterScene: number;
  readonly dynamicallyHabitableInnerScene: number | null;
  readonly dynamicallyHabitableOuterScene: number | null;
}

/**
 * HZ visual-consistency hotfix.
 *
 * The point-24.7 V2 layout deliberately added an independent minimum host
 * clearance and minimum visible band width. That made the HZ readable, but it
 * could also move its scene-space edges beyond planetary orbits that are
 * physically and scientifically outside the zone.
 *
 * V3 removes that second radial transform. Every HZ edge now consumes the
 * exact result of the same AU -> scene projection used by orbital geometry.
 * Readability must be achieved by material/edge styling, never by changing the
 * radial relationship between the HZ and the system's bodies.
 */
export function buildSystemSceneHabitableZonePresentationV3(
  input: SystemSceneHabitableZonePresentationInput,
): SystemSceneHabitableZonePresentationLayout {
  assertPositiveFinite(input.radiativeInnerAu, 'radiativeInnerAu');
  assertPositiveFinite(input.radiativeOuterAu, 'radiativeOuterAu');
  assertPositiveFinite(
    input.projectedRadiativeInnerScene,
    'projectedRadiativeInnerScene',
  );
  assertPositiveFinite(
    input.projectedRadiativeOuterScene,
    'projectedRadiativeOuterScene',
  );

  if (input.radiativeOuterAu <= input.radiativeInnerAu) {
    throw new RangeError('radiativeOuterAu must exceed radiativeInnerAu.');
  }

  if (
    input.projectedRadiativeOuterScene <=
    input.projectedRadiativeInnerScene
  ) {
    throw new RangeError(
      'projectedRadiativeOuterScene must exceed projectedRadiativeInnerScene.',
    );
  }

  const dynamicPairAvailable =
    input.dynamicallyHabitableInnerAu !== null &&
    input.dynamicallyHabitableOuterAu !== null;

  const projectedDynamicPairAvailable =
    input.projectedDynamicallyHabitableInnerScene !== null &&
    input.projectedDynamicallyHabitableOuterScene !== null;

  if (dynamicPairAvailable !== projectedDynamicPairAvailable) {
    throw new RangeError(
      'Dynamic HZ AU edges and projected scene edges must be provided together.',
    );
  }

  if (!dynamicPairAvailable) {
    return Object.freeze({
      radiativeInnerScene: input.projectedRadiativeInnerScene,
      radiativeOuterScene: input.projectedRadiativeOuterScene,
      dynamicallyHabitableInnerScene: null,
      dynamicallyHabitableOuterScene: null,
    });
  }

  const dynamicInnerAu = input.dynamicallyHabitableInnerAu!;
  const dynamicOuterAu = input.dynamicallyHabitableOuterAu!;
  const projectedDynamicInner =
    input.projectedDynamicallyHabitableInnerScene!;
  const projectedDynamicOuter =
    input.projectedDynamicallyHabitableOuterScene!;

  assertPositiveFinite(dynamicInnerAu, 'dynamicallyHabitableInnerAu');
  assertPositiveFinite(dynamicOuterAu, 'dynamicallyHabitableOuterAu');
  assertPositiveFinite(
    projectedDynamicInner,
    'projectedDynamicallyHabitableInnerScene',
  );
  assertPositiveFinite(
    projectedDynamicOuter,
    'projectedDynamicallyHabitableOuterScene',
  );

  if (
    dynamicInnerAu < input.radiativeInnerAu ||
    dynamicOuterAu > input.radiativeOuterAu ||
    dynamicOuterAu <= dynamicInnerAu
  ) {
    throw new RangeError(
      'Dynamic HZ must be a positive-width subset of the radiative HZ.',
    );
  }

  if (
    projectedDynamicInner < input.projectedRadiativeInnerScene - 1e-9 ||
    projectedDynamicOuter > input.projectedRadiativeOuterScene + 1e-9 ||
    projectedDynamicOuter <= projectedDynamicInner
  ) {
    throw new RangeError(
      'Projected dynamic HZ must preserve the projected radiative ordering.',
    );
  }

  return Object.freeze({
    radiativeInnerScene: input.projectedRadiativeInnerScene,
    radiativeOuterScene: input.projectedRadiativeOuterScene,
    dynamicallyHabitableInnerScene: projectedDynamicInner,
    dynamicallyHabitableOuterScene: projectedDynamicOuter,
  });
}

function assertPositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(
      `${label} must be finite and greater than zero: ${value}.`,
    );
  }
}
