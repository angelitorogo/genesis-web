import {
  vi,
} from 'vitest';

import {
  GalacticObjectScientificSubject,
  GalacticObjectScientificSurveyFamily,
} from '../../domain/galactic-object/galactic-object-scientific-subject';

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
  UniverseSeed,
} from '../../domain/universe/universe-seed';

import {
  IntermediateMassBlackHoleGenerator,
} from '../../simulation/galactic-object/intermediate-mass-black-hole-generator';

import {
  GalacticSupermassiveBlackHoleGenerator,
} from '../../simulation/nuclear/galactic-supermassive-black-hole-generator';

import {
  ArchiveGalacticObjectKnowledgeLevel,
  ArchiveGalacticObjectRenderKind,
  type ArchiveGalacticObjectCardModel,
} from './archive-galactic-object-card';

import {
  ArchiveEventHorizonApproachAssembler,
} from './archive-event-horizon-approach';

const generationKey =
  new UniverseGenerationKey(
    UniverseSeed.parse(
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5',
    ),
    GeneratorVersion.V2,
  );

const locator =
  new GalacticObjectLocator(
    0n,
    0n,
    0n,
  );

function card(
  subject:
    GalacticObjectScientificSubject | null,

  knowledgeLevel:
    ArchiveGalacticObjectKnowledgeLevel,
): ArchiveGalacticObjectCardModel {
  return Object.freeze({
    coarseFamily:
      GalacticObjectScientificSurveyFamily.EXTREME_OBJECT,

    scientificSubject:
      subject,

    knowledgeLevel,

    knowledgeLevelLabel:
      knowledgeLevel,

    title:
      'Objeto extremo',

    summary:
      'Resumen',

    nextScientificStep:
      'Siguiente paso',

    facts:
      Object.freeze([]),

    scientificSections:
      Object.freeze([]),

    render:
      Object.freeze({
        kind:
          ArchiveGalacticObjectRenderKind.EXTREME_OBJECT,
        knowledgeLevel,
        seed:
          '28.2c',
        accessibleLabel:
          'Objeto extremo',
        variant:
          null,
        renderProfile:
          null,
        scale:
          1,
        density:
          1,
        energy:
          1,
        concentration:
          1,
      }),
  });
}

describe('28.2c — event-horizon approach eligibility', () => {
  afterEach(
    () => {
      vi.restoreAllMocks();
    },
  );

  it('keeps the action hidden before CATALOGUED', () => {
    expect(
      ArchiveEventHorizonApproachAssembler
        .build(
          generationKey,
          locator,
          card(
            GalacticObjectScientificSubject
              .INTERMEDIATE_MASS_BLACK_HOLE,
            ArchiveGalacticObjectKnowledgeLevel
              .IDENTIFIED,
          ),
        ),
    ).toBeNull();
  });

  it('keeps supernova remnants ineligible even when CONFIRMED', () => {
    expect(
      ArchiveEventHorizonApproachAssembler
        .build(
          generationKey,
          locator,
          card(
            GalacticObjectScientificSubject
              .SUPERNOVA_REMNANT,
            ArchiveGalacticObjectKnowledgeLevel
              .CONFIRMED,
          ),
        ),
    ).toBeNull();
  });

  it('enables a CATALOGUED IMBH only from its existing physical horizon reference', () => {
    vi.spyOn(
      IntermediateMassBlackHoleGenerator,
      'generate',
    ).mockReturnValue({
      physicalProperties: {
        schwarzschildRadiusKm:
          1_234,
      },
    } as never);

    const model =
      ArchiveEventHorizonApproachAssembler
        .build(
          generationKey,
          locator,
          card(
            GalacticObjectScientificSubject
              .INTERMEDIATE_MASS_BLACK_HOLE,
            ArchiveGalacticObjectKnowledgeLevel
              .CATALOGUED,
          ),
        );

    expect(model?.buttonLabel).toBe(
      'SIMULAR APROXIMACIÓN EXTERNA',
    );

    expect(
      model?.schwarzschildRadiusKm,
    ).toBe(
      1_234,
    );

    expect(
      model?.knowledgeDisclosure,
    ).toContain(
      'aún puede requerir confirmación independiente',
    );

    expect(
      model?.scientificScope,
    ).toContain(
      'r > Rs',
    );
  });

  it('uses CONFIRMED disclosure for an AGN with an existing central SMBH', () => {
    vi.spyOn(
      GalacticSupermassiveBlackHoleGenerator,
      'generateForLocator',
    ).mockReturnValue({
      physicalProfile: {
        schwarzschildRadiusKm:
          9_876_543,
      },
    } as never);

    const model =
      ArchiveEventHorizonApproachAssembler
        .build(
          generationKey,
          locator,
          card(
            GalacticObjectScientificSubject
              .ACTIVE_GALACTIC_NUCLEUS,
            ArchiveGalacticObjectKnowledgeLevel
              .CONFIRMED,
          ),
        );

    expect(
      model?.knowledgeLevel,
    ).toBe(
      ArchiveGalacticObjectKnowledgeLevel
        .CONFIRMED,
    );

    expect(
      model?.knowledgeDisclosure,
    ).toContain(
      'clasificación compacta está confirmada',
    );

    expect(
      model?.scientificScope,
    ).toContain(
      'Schwarzschild no rotante',
    );

    expect(
      model?.scientificScope,
    ).toContain(
      'cruce del horizonte',
    );
  });

  it('refuses an AGN card if no central black-hole reference resolves', () => {
    vi.spyOn(
      GalacticSupermassiveBlackHoleGenerator,
      'generateForLocator',
    ).mockReturnValue(
      null,
    );

    expect(
      ArchiveEventHorizonApproachAssembler
        .build(
          generationKey,
          locator,
          card(
            GalacticObjectScientificSubject
              .ACTIVE_GALACTIC_NUCLEUS,
            ArchiveGalacticObjectKnowledgeLevel
              .CONFIRMED,
          ),
        ),
    ).toBeNull();
  });
});
