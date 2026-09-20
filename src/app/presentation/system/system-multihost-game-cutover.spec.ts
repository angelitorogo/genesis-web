import { vi } from 'vitest';
import { GeneratorVersion } from '../../domain/generation/generator-version';
import { type ArchiveDiscoveryDetailModel } from '../genesis-archive/archive-discovery-detail.facade';
import { SystemMultihostGameCutover } from './system-multihost-game-cutover';
import { SystemMultihostScientificSession } from './system-multihost-scientific-session';

const asModel = (code: number): ArchiveDiscoveryDetailModel =>
  ({ generatorVersionCode: code } as ArchiveDiscoveryDetailModel);

describe('Stage 10: atomic, version-gated production multihost entrypoint', () => {
  it('never reinterprets an existing V1 system or builds a secondary population', () => {
    const build = vi.spyOn(SystemMultihostScientificSession, 'buildOrNull');
    try {
      expect(SystemMultihostGameCutover.sessionOrNull(asModel(GeneratorVersion.V1.code))).toBeNull();
      expect(build).not.toHaveBeenCalled();
    } finally {
      build.mockRestore();
    }
  });

  it('all three consumer pages share an explicit V2-only session entrypoint', () => {
    const stub = {} as SystemMultihostScientificSession;
    const build = vi.spyOn(SystemMultihostScientificSession, 'buildOrNull').mockReturnValue(stub);
    const model = asModel(GeneratorVersion.V2.code);
    try {
      expect(SystemMultihostGameCutover.sessionOrNull(model)).toBe(stub);
      expect(build).toHaveBeenCalledOnce();
      expect(build).toHaveBeenCalledWith(model);
    } finally {
      build.mockRestore();
    }
  });

  it('unknown persisted version must never silently use the V1 generator', () => {
    const build = vi.spyOn(SystemMultihostScientificSession, 'buildOrNull');
    try {
      expect(() => SystemMultihostGameCutover.sessionOrNull(asModel(999))).toThrow(RangeError);
      expect(build).not.toHaveBeenCalled();
    } finally {
      build.mockRestore();
    }
  });
});
