export const V1_GOLDEN_VECTORS =
  Object.freeze({
    universeSeed:
      '7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B1',

    generatorVersionCode:
      1,

    prngUint64Hex:
      Object.freeze([
        '7AA3326A3671994E',
        '252D3D0DA1C89BA2',
        '98ED90416CA62029',
        'D0D2FD05833601AE',
        '229118A5F6B5ABF2',
        '4AF3B4689B465EA1',
        '7E746EB987000C9F',
        '8F58D85FEF3BBB4F',
        'AF2D01FC9AF30478',
        '6934E6ED1D75D47B',
      ]),

    galaxies:
      Object.freeze([
        Object.freeze({
          index:
            0n,

          seed:
            '8BA08585BCBD4D3041C1FD9EEBD048E4',
        }),

        Object.freeze({
          index:
            1n,

          seed:
            'A448D6B11BAF31F30904C808DE482290',
        }),

        Object.freeze({
          index:
            2n,

          seed:
            '36476A29035F432790C617E3E6D3D5A6',
        }),

        Object.freeze({
          index:
            3n,

          seed:
            'EFED806D7A693EAE0FA47F004B80F283',
        }),
      ]),

    canonicalBranch:
      Object.freeze({
        galaxyIndex:
          0n,

        galaxySeed:
          '8BA08585BCBD4D3041C1FD9EEBD048E4',

        sectorKey:
          123456789n,

        sectorSeed:
          '02DF63D582A1F3E9BFB71AA643FDBB92',

        galacticObjectIndex:
          7n,

        galacticObjectSeed:
          '22D2E7D76E3C1EB35611802BC34E378E',

        systemSeed:
          '58691B1E4E539DBA3EB173F795FDE7E2',

        bodyIndex:
          3n,

        bodySeed:
          '86FE2CB4F2CC4678D23F310333F15EF7',

        historySeed:
          '2103F53D83EB40DC1381A8B8FD21DD22',

        evolutionSeed:
          '4FD989860C1B323DF20342876B486958',

        civilizationIndex:
          1n,

        civilizationSeed:
          'ED3EC33F28E7B841CBDE4307F71D3C64',
      }),

    sectorKeyCodec:
      Object.freeze([
        Object.freeze({
          x: 0,
          y: 0,
          sectorKey: 0n,
        }),

        Object.freeze({
          x: 0,
          y: 1,
          sectorKey: 1n,
        }),

        Object.freeze({
          x: 1,
          y: 0,
          sectorKey:
            4294967296n,
        }),

        Object.freeze({
          x: -1,
          y: 0,
          sectorKey:
            -4294967296n,
        }),

        Object.freeze({
          x: 0,
          y: -1,
          sectorKey:
            4294967295n,
        }),

        Object.freeze({
          x: -1,
          y: -1,
          sectorKey: -1n,
        }),
      ]),

    locators:
      Object.freeze({
        galaxy:
          Object.freeze({
            galaxyIndex:
              0n,
          }),

        sector:
          Object.freeze({
            galaxyIndex:
              0n,

            sectorKey:
              123456789n,
          }),

        galacticObject:
          Object.freeze({
            galaxyIndex:
              0n,

            sectorKey:
              123456789n,

            galacticObjectIndex:
              7n,
          }),

        system:
          Object.freeze({
            galaxyIndex:
              0n,

            sectorKey:
              123456789n,

            galacticObjectIndex:
              7n,
          }),

        body:
          Object.freeze({
            galaxyIndex:
              0n,

            sectorKey:
              123456789n,

            galacticObjectIndex:
              7n,

            bodyIndex:
              3n,
          }),

        civilization:
          Object.freeze({
            galaxyIndex:
              0n,

            sectorKey:
              123456789n,

            galacticObjectIndex:
              7n,

            bodyIndex:
              3n,

            civilizationIndex:
              1n,
          }),
      }),
  });