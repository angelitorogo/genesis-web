import {
  ProtoplanetMigrationDirection,
} from './protoplanet-migration-direction';

describe(
  'ProtoplanetMigrationDirection point 17.5',
  () => {
    it(
      'should expose only the frozen V1 net migration directions',
      () => {
        expect(
          Object.values(
            ProtoplanetMigrationDirection,
          ),
        ).toEqual([
          'NONE',
          'INWARD',
          'OUTWARD',
        ]);
      },
    );
  },
);
