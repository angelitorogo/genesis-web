import { GeneratorVersion } from '../../domain/generation/generator-version';
import { UniverseGenerationKey } from '../../domain/generation/universe-generation-key';
import { UniverseSeed } from '../../domain/universe/universe-seed';
import {
  ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY,
  activeUniverseRef,
  resolveSavedUniverse,
} from './active-universe-selection';
import { UniverseSeedFacade } from './universe-seed.facade';

const seed = UniverseSeed.parse('7F21-A9D4-18CE-4B70-92F1-6A0C-6E35-D8B5');
const v1 = new UniverseGenerationKey(seed, GeneratorVersion.V1);
const v2 = new UniverseGenerationKey(seed.copy(), GeneratorVersion.V2);
const other = new UniverseGenerationKey(
  UniverseSeed.parse('1403-0000-0000-0000-0000-0000-0000-0003'), GeneratorVersion.V2,
);

describe('14.3 — selección persistente y aislamiento V1/V2', () => {
  beforeEach(() => {
    try { localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY); } catch { /* unavailable */ }
  });

  afterEach(() => {
    try { localStorage.removeItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY); } catch { /* unavailable */ }
  });

  it('prioriza el universo elegido y guardado incluso cuando V1 comparte su semilla', () => {
    const reference = activeUniverseRef(v2);
    expect(reference).toMatch(/^[0-9A-F]{32}$/);
    expect(reference).not.toContain(seed.serialize());
    expect(reference).not.toBe(activeUniverseRef(v1));
    expect(resolveSavedUniverse([v1, v2], v1, false, reference)).toBe(v2);
    expect(resolveSavedUniverse([v2, v1], v1, false, reference)).toBe(v2);
  });

  it('rechaza una referencia inexistente cuando hay varias partidas; nunca cae sobre V1', () => {
    expect(resolveSavedUniverse([v1, v2], v1, false, 'INVALID')).toBeNull();
    expect(resolveSavedUniverse([v1, other], v1, false, activeUniverseRef(v2))).toBeNull();
    expect(resolveSavedUniverse([], v1, false, activeUniverseRef(v2))).toBeNull();
    expect(resolveSavedUniverse([other], v1, false, activeUniverseRef(v2))).toBe(other);
  });

  it('conserva una selección explícita frente a una preferencia obsoleta', () => {
    expect(resolveSavedUniverse([v1, v2], v1, true, activeUniverseRef(v2))).toBe(v1);
    expect(resolveSavedUniverse([v1, v2], other, true, activeUniverseRef(v2))).toBeNull();
    expect(resolveSavedUniverse([v1, v2], v1, false, null)).toBe(v1);
  });

  it('solo guarda la selección tras confirmar bootstrap y la recupera en una nueva fachada', () => {
    const old = new UniverseSeedFacade();
    old.updateDraft(other.universeSeed.serialize());
    expect(old.applyDraft(GeneratorVersion.V2)).toBe(true);
    expect(localStorage.getItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY)).toBeNull();
    old.markUniverseCreated();
    expect(localStorage.getItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY)).toBe(activeUniverseRef(other));
    const reloaded = new UniverseSeedFacade();
    expect(reloaded.activeGenerationKey().equals(v1)).toBe(true);
    expect(reloaded.resolvePersistedUniverse([v1, other])).toBe(other);
    reloaded.activatePersistedUniverse(other);
    expect(reloaded.activeGenerationKey().equals(other)).toBe(true);
  });

  it('un fallo de bootstrap no sustituye el último universo confirmado', () => {
    const old = new UniverseSeedFacade();
    old.activatePersistedUniverse(v2);
    old.markUniverseActivated();
    old.updateDraft(other.universeSeed.serialize());
    old.applyDraft(GeneratorVersion.V2);
    old.markUniverseActivationFailed();
    expect(localStorage.getItem(ACTIVE_UNIVERSE_SELECTION_STORAGE_KEY)).toBe(activeUniverseRef(v2));
    expect(new UniverseSeedFacade().resolvePersistedUniverse([v1, v2, other])).toBe(v2);
  });
});
