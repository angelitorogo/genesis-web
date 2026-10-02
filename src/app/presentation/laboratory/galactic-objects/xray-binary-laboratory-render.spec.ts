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
    expect(element.querySelector('[data-testid="xray-binary-laboratory-donor-preview"]')).toBeTruthy();
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
});
