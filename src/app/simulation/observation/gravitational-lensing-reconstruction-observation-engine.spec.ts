import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  GeneratorVersion,
} from '../../domain/generation/generator-version';

import {
  GalacticObjectLocator,
} from '../../domain/generation/procedural-locator';

import {
  UniverseGenerationKey,
} from '../../domain/generation/universe-generation-key';

import {
  ObservationActionType,
} from '../../domain/observation/observation-action';

import {
  ObservationInstrumentType,
} from '../../domain/observation/observation-instrument';

import {
  ObservationInstrumentLevel,
} from '../../domain/observation/observation-instrument-capability';

import {
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  GravitationalLensingReconstructionProfileEngine,
} from '../galactic-object/gravitational-lensing-reconstruction-profile-engine';

import {
  GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
  GravitationalLensingReconstructionObservationEngine,
} from './gravitational-lensing-reconstruction-observation-engine';

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V2,
  );

const detectedLens =
  findActiveNucleus(
    true,
  );

const undetectedLens =
  findActiveNucleus(
    false,
  );

describe(
  '28.6 — gravitational-lensing reconstruction observation contract',
  () => {
    it(
      'requires a CONFIRMED canonical compact-mass lens',
      () => {
        expect(
          GravitationalLensingReconstructionObservationEngine
            .physicalProfileOrNull(
              key,
              detectedLens,
              DiscoveryState.CATALOGUED,
            ),
        ).toBeNull();

        expect(
          GravitationalLensingReconstructionObservationEngine
            .physicalProfileOrNull(
              key,
              detectedLens,
              DiscoveryState.CONFIRMED,
            ),
        ).not.toBeNull();
      },
    );

    it(
      'uses REOBSERVE with optical level 5 for high-resolution astrometric reconstruction',
      () => {
        expect(
          GRAVITATIONAL_LENSING_RECONSTRUCTION_INSTRUMENT,
        ).toBe(
          ObservationInstrumentType.OPTICAL,
        );

        const rule =
          GravitationalLensingReconstructionObservationEngine
            .evidenceRule();

        expect(
          rule.observationActionType,
        ).toBe(
          ObservationActionType.REOBSERVE,
        );

        expect(
          rule.minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_5,
        );

        expect(
          rule.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.OPTICAL,
        ]);
      },
    );

    it(
      'publishes normalized source-plane reconstruction without inventing an absolute Einstein angle',
      () => {
        const profile =
          GravitationalLensingReconstructionObservationEngine
            .physicalProfileOrNull(
              key,
              detectedLens,
              DiscoveryState.CONFIRMED,
            )!;

        const facts =
          GravitationalLensingReconstructionObservationEngine
            .measurementFacts(
              profile,
            );

        expect(
          facts.find(
            fact =>
              fact.label ===
                'Resultado de la campaña',
          )?.value,
        ).toContain(
          'reconstruible detectada',
        );

        expect(
          facts.find(
            fact =>
              fact.label ===
                'Fuente reconstruida · desplazamiento',
          )?.value,
        ).toContain(
          'β / θE',
        );

        expect(
          facts.find(
            fact =>
              fact.label ===
                'Límite del modelo',
          )?.value,
        ).toContain(
          'sin escala angular absoluta',
        );
      },
    );

    it(
      'keeps non-detection scientifically explicit and publishes no fabricated reconstruction facts',
      () => {
        const profile =
          GravitationalLensingReconstructionObservationEngine
            .physicalProfileOrNull(
              key,
              undetectedLens,
              DiscoveryState.CONFIRMED,
            )!;

        const facts =
          GravitationalLensingReconstructionObservationEngine
            .measurementFacts(
              profile,
            );

        expect(
          facts.find(
            fact =>
              fact.label ===
                'Resultado de la campaña',
          )?.value,
        ).toContain(
          'Sin configuración',
        );

        expect(
          facts.some(
            fact =>
              fact.label ===
                'Fuente reconstruida · desplazamiento',
          ),
        ).toBe(false);

        expect(
          facts.find(
            fact =>
              fact.label ===
                'Interpretación',
          )?.value,
        ).toContain(
          'no implica ausencia de lente gravitacional débil',
        );
      },
    );
  },
);

function findActiveNucleus(
  requireDetection:
    boolean,
): GalacticObjectLocator {

  for (
    let galaxyIndex =
      0n;
    galaxyIndex <
      512n;
    galaxyIndex +=
      1n
  ) {
    const locator =
      new GalacticObjectLocator(
        galaxyIndex,
        0n,
        0n,
      );

    const profile =
      GravitationalLensingReconstructionProfileEngine
        .resolveConfirmed(
          key,
          locator,
          DiscoveryState.CONFIRMED,
        );

    if (
      profile !==
        null &&
      profile.reconstructableLensingSignatureDetected ===
        requireDetection
    ) {
      return locator;
    }
  }

  throw new Error(
    'Missing deterministic active-nucleus 28.6 observation fixture.',
  );
}
