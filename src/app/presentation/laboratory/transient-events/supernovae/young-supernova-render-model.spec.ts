import { SupernovaType } from '../../../../domain/transient/supernova-type';
import { SUPERNOVA_LABORATORY_CASES } from './supernova-laboratory-fixtures';
import { YoungSupernovaRenderModelBuilder } from './young-supernova-render-model';

describe('29.1A.4b — YoungSupernovaRenderModelBuilder', () => {
  it('keeps the render centered by expressing asymmetry as shape parameters only', () => {
    const model = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES[1].profile,
      600,
    );

    expect(model.radius).toBeGreaterThan(0.3);
    expect(model.asymmetry).toBeGreaterThan(0);
    expect('offsetX' in model).toBe(false);
    expect('offsetY' in model).toBe(false);
  });

  it('gives Ia, II, Ib and Ic genuinely different structural fingerprints', () => {
    const fingerprints = SUPERNOVA_LABORATORY_CASES.map(item => {
      const model = YoungSupernovaRenderModelBuilder.build(item.profile, 600);
      return JSON.stringify({
        typeIndex: model.typeIndex,
        aspect: model.aspect,
        breakup: model.breakup,
        clumpiness: model.clumpiness,
        asymmetry: model.asymmetry,
        interiorStrength: model.interiorStrength,
        directionalStrength: model.directionalStrength,
      });
    });

    expect(new Set(fingerprints).size).toBe(4);
  });

  it('separates the Type II and Type Ib visual fingerprints instead of treating them as near-duplicates', () => {
    const ii = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_II)!.profile,
      900,
    );
    const ib = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_IB)!.profile,
      900,
    );

    expect(ii.shellThickness).toBeGreaterThan(ib.shellThickness);
    expect(ii.clumpiness).toBeGreaterThan(ib.clumpiness);
    expect(ii.interiorStrength).toBeGreaterThan(ib.interiorStrength);
    expect(ib.filamentStrength).toBeGreaterThan(ii.filamentStrength);
    expect(ib.directionalStrength).toBeGreaterThan(ii.directionalStrength);
  });

  it('makes Type Ic the most anisotropic family without introducing a compact source', () => {
    const ic = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_IC)!.profile,
      1000,
    );
    const ii = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_II)!.profile,
      1000,
    );

    expect(ic.aspect).toBeGreaterThan(ii.aspect);
    expect(ic.asymmetry).toBeGreaterThan(ii.asymmetry);
    expect(ic.directionalStrength).toBeGreaterThan(ii.directionalStrength);
    expect(ic.compactSourceStrength).toBe(0);
  });

  it('keeps Ia free from a compact source while allowing the Ib neutron-star remnant to emerge', () => {
    const ia = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_IA)!.profile,
      1200,
    );
    const ib = YoungSupernovaRenderModelBuilder.build(
      SUPERNOVA_LABORATORY_CASES.find(item => item.id === SupernovaType.TYPE_IB)!.profile,
      1200,
    );

    expect(ia.compactKind).toBe(0);
    expect(ia.compactSourceStrength).toBe(0);
    expect(ib.compactKind).toBe(1);
    expect(ib.compactSourceStrength).toBeGreaterThan(0);
  });
});
