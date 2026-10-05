import {
  DiscoveryState,
} from '../../domain/discovery/discovery-state';

import {
  ExplorationResultKind,
} from '../../domain/exploration/exploration-sector-result';

import {
  ExtremeType,
} from '../../domain/galactic-object/extreme-object-type';

import {
  frozenPhysicalSourceKey,
} from '../../domain/generation/frozen-physical-source-key';

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
  ExplorationSectorResultEngine,
} from '../exploration/exploration-sector-result-engine';

import {
  ExtremeObjectTypeResolver,
} from '../galactic-object/extreme-object-type-resolver';

import {
  GalaxySectorContentGenerator,
} from '../sector/galaxy-sector-content-generator';

import {
  GalaxyGenerator,
} from '../universe/galaxy-generator';

import {
  RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
  RelativisticJetAnalysisObservationEngine,
} from './relativistic-jet-analysis-observation-engine';

const key =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',
    ),
    GeneratorVersion.V2,
  );

const microquasar =
  findMicroquasar();

describe(
  '28.5 — relativistic-jet observation contract',
  () => {
    it(
      'requires a CONFIRMED eligible jet-analysis context',
      () => {
        expect(
          RelativisticJetAnalysisObservationEngine
            .physicalProfileOrNull(
              key,
              microquasar,
              DiscoveryState.CATALOGUED,
            ),
        ).toBeNull();

        expect(
          RelativisticJetAnalysisObservationEngine
            .physicalProfileOrNull(
              key,
              microquasar,
              DiscoveryState.CONFIRMED,
            ),
        ).not.toBeNull();
      },
    );

    it(
      'uses the existing REOBSERVE vocabulary with radio level 4 only',
      () => {
        expect(
          RELATIVISTIC_JET_ANALYSIS_INSTRUMENT,
        ).toBe(
          ObservationInstrumentType.RADIO,
        );

        const rule =
          RelativisticJetAnalysisObservationEngine
            .evidenceRule();

        expect(
          rule.observationActionType,
        ).toBe(
          ObservationActionType.REOBSERVE,
        );

        expect(
          rule.minimumInstrumentLevel,
        ).toBe(
          ObservationInstrumentLevel.LEVEL_4,
        );

        expect(
          rule.compatibleInstrumentTypes,
        ).toEqual([
          ObservationInstrumentType.RADIO,
        ]);
      },
    );

    it(
      'publishes explicit relativistic kinematics without claiming superluminal matter or fabricated microquasar power',
      () => {
        const profile =
          RelativisticJetAnalysisObservationEngine
            .physicalProfileOrNull(
              key,
              microquasar,
              DiscoveryState.CONFIRMED,
            )!;

        const facts =
          RelativisticJetAnalysisObservationEngine
            .measurementFacts(
              profile,
            );

        expect(
          facts.some(
            fact =>
              fact.label ===
              'Factor de Lorentz bulk (modelo)',
          ),
        ).toBe(true);

        expect(
          facts.find(
            fact =>
              fact.label ===
              'Velocidad aparente · aproximante',
          )?.value,
        ).toContain(
          'aparente, no transporte superlumínico',
        );

        expect(
          facts.find(
            fact =>
              fact.label ===
              'Potencia cinética',
          )?.value,
        ).toContain(
          'No determinada',
        );
      },
    );
  },
);

function findMicroquasar():
  GalacticObjectLocator {

  const galaxy =
    GalaxyGenerator.generate(
      key,
      0n,
    );

  const physicalKey =
    frozenPhysicalSourceKey(
      key,
    );

  for (
    let x =
      -48;
    x <=
      48;
    x +=
      1
  ) {
    for (
      let y =
        -48;
      y <=
        48;
      y +=
        1
    ) {
      if (
        x ===
          0 &&
        y ===
          0
      ) {
        continue;
      }

      const content =
        GalaxySectorContentGenerator
          .generate(
            galaxy,
            {
              x,
              y,
            },
          );

      for (
        const locator
        of content.galacticObjectLocators
      ) {
        if (
          ExplorationSectorResultEngine
            .resolveGalacticObjectKind(
              physicalKey,
              locator,
            ) !==
          ExplorationResultKind.EXTREME_OBJECT
        ) {
          continue;
        }

        if (
          ExtremeObjectTypeResolver
            .resolve(
              key,
              locator,
            ) ===
          ExtremeType.MICROQUASAR
        ) {
          return locator;
        }
      }
    }
  }

  throw new Error(
    'Missing deterministic V2 microquasar fixture for 28.5.',
  );
}
