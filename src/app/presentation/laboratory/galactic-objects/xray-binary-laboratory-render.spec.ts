import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import { XrayBinaryLaboratoryRender } from './xray-binary-laboratory-render';
import { xrayBinaryLaboratoryModel } from './xray-binary-laboratory-render-model';

describe('28.2F.5 — XrayBinaryLaboratoryRender', () => {
  it('renders an illustrative neutron-star X-ray binary scene', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_NS, 0));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');

    expect(render).toBeTruthy();
    expect(render?.getAttribute('data-extreme-type')).toBe(ExtremeType.X_RAY_BINARY_NS);
    expect(element.textContent).toContain('disco de acreción caliente');
    expect(element.textContent).toContain('emisión X');
  });

  it('renders an illustrative black-hole X-ray binary scene', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_BH, 2));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');

    expect(render).toBeTruthy();
    expect(render?.getAttribute('data-extreme-type')).toBe(ExtremeType.X_RAY_BINARY_BH);
    expect(element.textContent).toContain('disco de acreción caliente');
    expect(element.textContent).toContain('emisión X');
  });


  it('renders a microquasar as the black-hole X-ray binary architecture with relativistic jets', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.MICROQUASAR, 4));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');

    expect(render).toBeTruthy();
    expect(render?.getAttribute('data-extreme-type')).toBe(ExtremeType.MICROQUASAR);
  });


  it('renders a ULX as a supercritical accretion system with radiative winds', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.ULX, 5));
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');

    expect(render).toBeTruthy();
    expect(render?.getAttribute('data-extreme-type')).toBe(ExtremeType.ULX);
    expect(element.textContent).toContain('disco supercrítico');
    expect(element.textContent).toContain('vientos radiativos');
  });

  it('can reuse the approved early-stage geometry in game without publishing the exact identity', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_BH, 3));
    fixture.componentRef.setInput('detailStage', 'DETECTED');
    fixture.componentRef.setInput('animationEnabled', false);
    fixture.componentRef.setInput('publishIdentity', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');

    expect(render?.getAttribute('data-detail-stage')).toBe('DETECTED');
    expect(render?.getAttribute('data-extreme-type')).toBeNull();
    expect(element.textContent).toContain('EXTREME_SOURCE');
    expect(element.textContent).toContain('Fuente extrema');
    expect(element.textContent).not.toContain(ExtremeType.X_RAY_BINARY_BH);
    expect(element.textContent).not.toContain('Binaria X con agujero negro');
  });

  it('supports a static inspection mode for later discovery-stage reuse', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.X_RAY_BINARY_NS, 1));
    fixture.componentRef.setInput('animationEnabled', false);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.xrb-render--static')).toBeTruthy();
  });

  it('exposes materially different DETECTED, DISCOVERED and CATALOGUED presentation contracts', () => {
    TestBed.configureTestingModule({ imports: [XrayBinaryLaboratoryRender] });
    const fixture = TestBed.createComponent(XrayBinaryLaboratoryRender);
    fixture.componentRef.setInput('model', xrayBinaryLaboratoryModel(ExtremeType.MICROQUASAR, 0));

    fixture.componentRef.setInput('detailStage', 'DETECTED');
    fixture.componentRef.setInput('animationEnabled', false);
    fixture.detectChanges();
    let element = fixture.nativeElement as HTMLElement;
    let render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');
    expect(render?.getAttribute('data-detail-stage')).toBe('DETECTED');
    expect(element.textContent).toContain('esquema de señal');
    expect(element.textContent).not.toContain('disco de acreción caliente');

    fixture.componentRef.setInput('detailStage', 'DISCOVERED');
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');
    expect(render?.getAttribute('data-detail-stage')).toBe('DISCOVERED');
    expect(element.textContent).toContain('transferencia simplificada');
    expect(element.textContent).not.toContain('jets relativistas');

    fixture.componentRef.setInput('detailStage', 'CATALOGUED');
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    render = element.querySelector('[data-testid="xray-binary-laboratory-render"]');
    expect(render?.getAttribute('data-detail-stage')).toBe('CATALOGUED');
    expect(element.textContent).toContain('disco de acreción caliente');
    expect(element.textContent).toContain('jets relativistas');
  });

});
