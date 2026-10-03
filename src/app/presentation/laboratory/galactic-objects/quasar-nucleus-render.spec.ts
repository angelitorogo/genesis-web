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
  QuasarNucleusVisualFamily,
  type QuasarNucleusRenderModel,
} from './quasar-nucleus-render-model';

import {
  QuasarNucleusRender,
} from './quasar-nucleus-render';

import {
  BlackHoleLaboratoryRender,
} from './black-hole-laboratory-render';

import {
  blackHoleLaboratoryModel,
} from './black-hole-laboratory-render-model';

const MODEL: QuasarNucleusRenderModel = Object.freeze({
  seed: '00112233445566778899AABBCCDDEEFF',
  family: QuasarNucleusVisualFamily.TWIN_RELATIVISTIC_JETS,
  familyIndex: 2,
  blackHoleMassSolarMasses: 1.0e9,
  normalizedMass: 0.7,
  orientationRadians: 0.2,
  inclination: 0.5,
  shadowRadius: 0.08,
  diskInnerRadius: 0.11,
  diskOuterRadius: 0.65,
  diskThickness: 0.05,
  accretionBrightness: 1.1,
  photonRingStrength: 0.9,
  lensingStrength: 0.9,
  dopplerAsymmetry: 0.5,
  turbulence: 0.4,
  clumpiness: 0.2,
  warp: 0.03,
  coronaStrength: 1.0,
  dustTorusOpacity: 0.1,
  jetStrength: 1.0,
  jetLength: 1.0,
  jetOpening: 0.035,
  jetCollimation: 0.9,
  counterJetRatio: 0.8,
  jetKnotStrength: 0.5,
  jetPrecession: 0.0,
  windStrength: 0.4,
  windOpening: 0.3,
  scatteringHaloStrength: 0.8,
  backgroundStarDensity: 0.04,
  palette: Object.freeze({
    innerDisk: Object.freeze([1, 0.95, 0.8] as const),
    midDisk: Object.freeze([1, 0.6, 0.2] as const),
    outerDisk: Object.freeze([0.5, 0.15, 0.05] as const),
    photonRing: Object.freeze([1, 0.95, 0.8] as const),
    corona: Object.freeze([0.6, 0.8, 1] as const),
    jetCore: Object.freeze([0.8, 0.95, 1] as const),
    jetSheath: Object.freeze([0.2, 0.5, 1] as const),
    wind: Object.freeze([0.4, 0.7, 1] as const),
  }),
});

describe('QuasarNucleusRender', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        QuasarNucleusRender,
      ],
    }).compileComponents();
  });

  it('renders a quasar as activity layers around the canonical 28.2F.3 SMBH', () => {
    const fixture = TestBed.createComponent(QuasarNucleusRender);

    fixture.componentRef.setInput('model', MODEL);
    fixture.componentRef.setInput(
      'blackHoleCoreModel',
      blackHoleLaboratoryModel(ExtremeType.SMBH, MODEL.familyIndex),
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="quasar-nucleus-render"]'))
      .toBeTruthy();

    expect(element.querySelector('canvas.quasar-nucleus-render__canvas'))
      .toBeNull();

    expect(element.querySelector('[data-testid="quasar-nucleus-render-starfield"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-corona"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-extended-disk"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-disk-glow"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-jet-plume-north"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-jet-plume-south"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-jet-north"]'))
      .toBeTruthy();
    expect(element.querySelector('[data-testid="quasar-nucleus-render-jet-south"]'))
      .toBeTruthy();

    expect(
      element.querySelector('[data-testid="quasar-nucleus-render"]')
        ?.getAttribute('data-family'),
    ).toBe(QuasarNucleusVisualFamily.TWIN_RELATIVISTIC_JETS);

    const embeddedCore = fixture.debugElement.query(
      By.directive(BlackHoleLaboratoryRender),
    )?.componentInstance as BlackHoleLaboratoryRender | undefined;

    expect(embeddedCore).toBeTruthy();
    expect(embeddedCore?.embedded).toBe(true);
    expect(embeddedCore?.quiescentMode).toBe(false);
    expect(embeddedCore?.model.type).toBe(ExtremeType.SMBH);

    expect(element.textContent).toContain('DISCO HIPERLUMINOSO');
    expect(element.textContent).toContain('CORONA');
    expect(element.textContent).toContain('JET BIPOLAR');
  });

  it('keeps both polar jet halves behind the canonical SMBH so they emerge from its contour', () => {
    const fixture = TestBed.createComponent(QuasarNucleusRender);

    fixture.componentRef.setInput('model', MODEL);
    fixture.componentRef.setInput(
      'blackHoleCoreModel',
      blackHoleLaboratoryModel(ExtremeType.SMBH, MODEL.familyIndex),
    );

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const northJet = element.querySelector(
      '[data-testid="quasar-nucleus-render-jet-north"]',
    );
    const southJet = element.querySelector(
      '[data-testid="quasar-nucleus-render-jet-south"]',
    );
    const core = element.querySelector(
      '[data-testid="quasar-nucleus-render-canonical-smbh-core"]',
    );

    expect(northJet).toBeTruthy();
    expect(southJet).toBeTruthy();
    expect(core).toBeTruthy();

    if (
      northJet === null ||
      southJet === null ||
      core === null
    ) {
      throw new Error('QUASAR polar jet DOM contract is incomplete.');
    }

    expect(
      Boolean(
        northJet.compareDocumentPosition(core) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(
      Boolean(
        southJet.compareDocumentPosition(core) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
  });
});
