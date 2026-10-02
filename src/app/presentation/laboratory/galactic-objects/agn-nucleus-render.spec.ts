import {
  TestBed,
} from '@angular/core/testing';

import {
  By,
} from '@angular/platform-browser';

import {
  ExtremeType,
} from '../../../domain/galactic-object/extreme-object-type';

import {
  type AgnNucleusRenderModel,
  AgnNucleusVisualFamily,
} from './agn-nucleus-render-model';

import {
  AgnNucleusRender,
} from './agn-nucleus-render';

import {
  BlackHoleLaboratoryRender,
} from './black-hole-laboratory-render';

import {
  blackHoleLaboratoryModel,
} from './black-hole-laboratory-render-model';

const MODEL: AgnNucleusRenderModel = Object.freeze({
  seed: '00112233445566778899AABBCCDDEEFF',
  family: AgnNucleusVisualFamily.THIN_LUMINOUS_DISK,
  familyIndex: 0,
  blackHoleMassSolarMasses: 1.0e8,
  normalizedMass: 0.5,
  orientationRadians: 0.2,
  inclination: 0.4,
  shadowRadius: 0.11,
  diskInnerRadius: 0.15,
  diskOuterRadius: 0.72,
  diskThickness: 0.04,
  accretionBrightness: 0.8,
  photonRingStrength: 0.7,
  lensingStrength: 0.7,
  dopplerAsymmetry: 0.3,
  turbulence: 0.3,
  clumpiness: 0.2,
  warp: 0.02,
  coronaStrength: 0.2,
  dustOpacity: 0.08,
  temperatureBias: 0.7,
  backgroundStarDensity: 0.03,
  palette: Object.freeze({
    innerDisk: Object.freeze([1, 0.9, 0.7] as const),
    midDisk: Object.freeze([0.9, 0.5, 0.2] as const),
    outerDisk: Object.freeze([0.4, 0.2, 0.1] as const),
    photonRing: Object.freeze([1, 0.95, 0.8] as const),
    corona: Object.freeze([0.5, 0.6, 0.8] as const),
  }),
});

describe('AgnNucleusRender', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgnNucleusRender,
      ],
    }).compileComponents();
  });

  it('renders only the canonical 28.2F.3 SMBH with no legacy AGN canvas behind it', () => {
    const fixture = TestBed.createComponent(AgnNucleusRender);

    fixture.componentRef.setInput('model', MODEL);
    fixture.componentRef.setInput(
      'blackHoleCoreModel',
      blackHoleLaboratoryModel(ExtremeType.SMBH, 0),
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector('[data-testid="agn-nucleus-render"]'),
    ).toBeTruthy();

    expect(
      element.querySelector('canvas.agn-nucleus-render__canvas'),
    ).toBeNull();

    expect(
      element.querySelector('[data-testid="agn-nucleus-render-starfield"]'),
    ).toBeTruthy();

    const embeddedCore = fixture.debugElement.query(
      By.directive(BlackHoleLaboratoryRender),
    )?.componentInstance as BlackHoleLaboratoryRender | undefined;

    expect(embeddedCore).toBeTruthy();
    expect(embeddedCore?.embedded).toBeTrue();
    expect(embeddedCore?.quiescentMode).toBeFalse();
    expect(embeddedCore?.model.type).toBe(ExtremeType.SMBH);
  });
});
