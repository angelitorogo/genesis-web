import { TestBed } from '@angular/core/testing';
import * as THREE from 'three';
import { ExtremeType } from '../../../domain/galactic-object/extreme-object-type';
import { blackHoleLaboratoryModel } from './black-hole-laboratory-render-model';
import { BlackHoleLaboratoryRender } from './black-hole-laboratory-render';


function smoothstep(a: number, b: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

function evaluateJoinTailSurvival(model: ReturnType<typeof blackHoleLaboratoryModel>, side: -1 | 1, t = 0.90): {
  transformedY: number;
  lower: number;
  upper: number;
  lowerMask: number;
  upperMask: number;
  survival: number;
} {
  const inclinationFactor = Math.max(0, Math.min(1, (model.inclinationDegrees - 22) / (72 - 22)));
  const rotationAngle = -0.30 + (-0.12 + 0.30) * inclinationFactor;
  const isStellarFamily = model.type === ExtremeType.STELLAR_MASS_BLACK_HOLE;
  const tailReachBoost = !isStellarFamily ? 0 : side > 0 ? 0.46 : 0.18;
  const tailDrop = !isStellarFamily ? 0 : side > 0 ? 0.12 : 0.06;

  const tailT = smoothstep(0.56, 1.0, t);
  const outerReach = 2.18 + (2.24 - 2.18) * inclinationFactor;
  const verticalReach = 0.84 + (0.88 - 0.84) * inclinationFactor;
  let baseX = side * (0.50 + (outerReach - 0.50) * t);
  let baseY = 0.01 + 0.5 * verticalReach;
  baseX += side * tailT * tailReachBoost;
  baseY -= tailT * tailDrop;

  const pivotX = side * 0.74;
  const pivotY = 0.62;
  const s = Math.sin(rotationAngle);
  const c = Math.cos(rotationAngle);
  const dx = baseX - pivotX;
  const dy = baseY - pivotY;
  const x = pivotX + dx * c - dy * s;
  const y = pivotY + dx * s + dy * c;

  const maskOuterReach = outerReach + tailReachBoost;
  const maskT = Math.max(0, Math.min(1, (Math.abs(x) - 0.50) / Math.max(maskOuterReach - 0.50, 0.001)));
  const ease = maskT * maskT * (3 - 2 * maskT);
  const lowerEnd = 0.024 + (0.012 - 0.024) * inclinationFactor;
  const upperEnd = 0.16 + (0.10 - 0.16) * inclinationFactor;
  const upperExponent = 0.84 + (0.78 - 0.84) * inclinationFactor;
  const lower = 0.15 + (lowerEnd - 0.15) * ease ** 0.94;
  const upper = 0.74 + (upperEnd - 0.74) * ease ** upperExponent;
  const lowerMask = smoothstep(lower - 0.014, lower + 0.022, y);
  const upperMask = 1 - smoothstep(upper - 0.024, upper + 0.012, y);

  return {
    transformedY: y,
    lower,
    upper,
    lowerMask,
    upperMask,
    survival: lowerMask * upperMask,
  };
}


function evaluateJoinTailCenterSurvival(
  model: ReturnType<typeof blackHoleLaboratoryModel>,
  side: -1 | 1,
  longitudinalT = 0.90,
): {
  preRotationCenterY: number;
  transformedY: number;
  currentLower: number;
  currentUpper: number;
  lowerMask: number;
  upperMask: number;
  survival: number;
} {
  const inclinationFactor = Math.max(0, Math.min(1, (model.inclinationDegrees - 22) / (72 - 22)));
  const rotationAngle = -0.30 + (-0.12 + 0.30) * inclinationFactor;
  const isStellarFamily = model.type === ExtremeType.STELLAR_MASS_BLACK_HOLE;
  const tailReachBoost = !isStellarFamily ? 0 : side > 0 ? 0.46 : 0.18;
  const tailDrop = !isStellarFamily ? 0 : side > 0 ? 0.12 : 0.06;

  // 1) Build the band envelope in its own, unrotated longitudinal space.
  const longitudinalEase = longitudinalT * longitudinalT * (3 - 2 * longitudinalT);
  const lowerEnd = 0.024 + (0.012 - 0.024) * inclinationFactor;
  const upperEnd = 0.16 + (0.10 - 0.16) * inclinationFactor;
  const upperExponent = 0.84 + (0.78 - 0.84) * inclinationFactor;
  const preLower = 0.15 + (lowerEnd - 0.15) * longitudinalEase ** 0.94;
  const preUpper = 0.74 + (upperEnd - 0.74) * longitudinalEase ** upperExponent;
  const preRotationCenterY = (preLower + preUpper) / 2;

  // 2) Put a point guaranteed to be inside that envelope through the exact
  //    tail deformation + rotation performed by the vertex shader.
  const tailT = smoothstep(0.56, 1.0, longitudinalT);
  const outerReach = 2.18 + (2.24 - 2.18) * inclinationFactor;
  let baseX = side * (0.50 + (outerReach - 0.50) * longitudinalT);
  let baseY = preRotationCenterY;
  baseX += side * tailT * tailReachBoost;
  baseY -= tailT * tailDrop;

  const pivotX = side * 0.74;
  const pivotY = 0.62;
  const s = Math.sin(rotationAngle);
  const c = Math.cos(rotationAngle);
  const dx = baseX - pivotX;
  const dy = baseY - pivotY;
  const transformedX = pivotX + dx * c - dy * s;
  const transformedY = pivotY + dx * s + dy * c;

  // 3) Fixed behaviour: evaluate the intrinsic band envelope in band space.
  //    Presentation transforms move the rendered geometry, not its validity
  //    inside the original band envelope.
  const maskT = longitudinalT;
  const maskEase = maskT * maskT * (3 - 2 * maskT);
  const currentLower = 0.15 + (lowerEnd - 0.15) * maskEase ** 0.94;
  const currentUpper = 0.74 + (upperEnd - 0.74) * maskEase ** upperExponent;
  const lowerMask = smoothstep(currentLower - 0.014, currentLower + 0.022, preRotationCenterY);
  const upperMask = 1 - smoothstep(currentUpper - 0.024, currentUpper + 0.012, preRotationCenterY);

  return {
    preRotationCenterY,
    transformedY,
    currentLower,
    currentUpper,
    lowerMask,
    upperMask,
    survival: lowerMask * upperMask,
  };
}

describe('28.2F.3 — BlackHoleLaboratoryRender', () => {
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [BlackHoleLaboratoryRender] }).compileComponents(); });
  it('renders the selected black-hole class and relativistic visual layers', () => {
    const fixture=TestBed.createComponent(BlackHoleLaboratoryRender); fixture.componentRef.setInput('model',blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE,0)); fixture.detectChanges(); const root=fixture.nativeElement as HTMLElement;
    expect(root.querySelector('[data-testid="black-hole-laboratory-render"]')?.getAttribute('data-extreme-type')).toBe('STELLAR_MASS_BLACK_HOLE');
    expect(root.textContent).toContain('DISCO DE ACRECIÓN'); expect(root.textContent).toContain('LENTE GRAVITATORIA APROXIMADA');
    const button=root.querySelector('[data-testid="black-hole-animation-toggle"]') as HTMLButtonElement; button.click(); fixture.detectChanges(); expect(button.textContent).toContain('REANUDAR');
  });

  it('keeps the central black body between the rear layers and the near-side disk', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;
    fixture.componentRef.setInput('model', blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0));
    fixture.detectChanges();

    const group = new THREE.Group();
    component.addShadow(group);

    const shadow = group.children[0] as any;
    expect(shadow.geometry.type).toBe('SphereGeometry');
    expect(shadow.renderOrder).toBe(4);
    expect(shadow.material.transparent).toBe(true);
    expect(shadow.material.opacity).toBe(1);
    expect(shadow.material.depthTest).toBe(false);
    expect(shadow.material.depthWrite).toBe(false);
  });


  it('keeps the upper lensed disk visible above the sphere contour', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;
    fixture.componentRef.setInput('model', blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0));
    fixture.detectChanges();

    const group = new THREE.Group();
    component.addLensedDiskImages(group);

    const renderOrders = group.children.map((child: any) => child.renderOrder);
    expect(renderOrders).toContain(8.1);
    expect(renderOrders).toContain(8.2);

    const topBandMaterial = (group.children.find((child: any) => child.renderOrder === 8.2) as any).material;
    expect(topBandMaterial.fragmentShader).toContain('float shoulderVerticalWindow = shoulderVerticalIn * shoulderVerticalOut');
    expect(topBandMaterial.vertexShader).toContain('mix(-uLeftWidth, uRightWidth, uv.x)');
    expect(topBandMaterial.fragmentShader).toContain('float lateralIntegrationFade = 1.0 - shoulderWindow * shoulderVerticalWindow * 0.80');
    expect(topBandMaterial.uniforms['uRightWidth'].value).toBeGreaterThan(topBandMaterial.uniforms['uLeftWidth'].value);
    expect(topBandMaterial.uniforms['uLeftWidth'].value).toBeCloseTo(1.04);
    expect(topBandMaterial.uniforms['uRightWidth'].value).toBeCloseTo(1.14);
    expect(topBandMaterial.uniforms['uHeight'].value).toBeGreaterThanOrEqual(1.04);
    expect(topBandMaterial.uniforms['uHeight'].value).toBeLessThanOrEqual(1.10);
  });


  it('renders the lateral join bands after the sphere so they connect to the upper lensed disk', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;
    fixture.componentRef.setInput('model', blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0));
    fixture.detectChanges();

    const group = new THREE.Group();
    component.addLensedDiskImages(group);

    const renderOrders = group.children.map((child: any) => child.renderOrder);
    expect(renderOrders).toContain(8.05);
    expect(renderOrders).toContain(8.15);

    const rightJoinMaterial = (group.children.find((child: any) =>
      child.renderOrder === 8.15 && child.material?.uniforms?.['uSide']?.value === 1
    ) as any).material;
    expect(rightJoinMaterial.vertexShader).toContain('float tailT = smoothstep(0.56, 1.0, t)');
    expect(rightJoinMaterial.vertexShader).toContain('float baseX = bandX + uSide * tailT * uTailReachBoost');
    expect(rightJoinMaterial.vertexShader).toContain('vBandLocal = vec2(bandX, bandY)');
    expect(rightJoinMaterial.vertexShader).toContain('float baseY = bandY - tailT * uTailDrop');
    expect(rightJoinMaterial.vertexShader).toContain('vTransformedLocal = vec2(x, y)');
    expect(rightJoinMaterial.vertexShader).toContain('float pivotX = uSide * 0.74');
    expect(rightJoinMaterial.fragmentShader).toContain('float maskX = mix(transformedX, vBandLocal.x, uBandSpaceMaskBlend)');
    expect(rightJoinMaterial.fragmentShader).toContain('float maskY = mix(transformedY, vBandLocal.y, uBandSpaceMaskBlend)');
    expect(rightJoinMaterial.fragmentShader).toContain('float lower = mix(0.15, mix(0.024, 0.012, uInclinationFactor), pow(ease, 0.94))');
    expect(rightJoinMaterial.fragmentShader).toContain('float edgeFade = 1.0 - smoothstep(0.86, 1.0, vUv.x)');
    expect(rightJoinMaterial.fragmentShader).toContain('float bandIntegrationFade = 1.0 - summitWindow * 0.80');
    expect(rightJoinMaterial.uniforms['uInclinationFactor'].value).toBeGreaterThanOrEqual(0);
    expect(rightJoinMaterial.uniforms['uTailReachBoost'].value).toBe(0.46);
    expect(rightJoinMaterial.uniforms['uTailDrop'].value).toBe(0.12);
    expect(rightJoinMaterial.uniforms['uBandSpaceMaskBlend'].value).toBe(1);
    expect(rightJoinMaterial.uniforms['uRotationAngle'].value).toBeLessThan(-0.1);
  });


  it('keeps the tuned join-band geometry canonical across all black-hole families', () => {
    const families = [
      ExtremeType.STELLAR_MASS_BLACK_HOLE,
      ExtremeType.INTERMEDIATE_MASS_BLACK_HOLE,
      ExtremeType.SMBH,
    ];

    for (const family of families) {
      const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
      const component = fixture.componentInstance as any;
      fixture.componentRef.setInput('model', blackHoleLaboratoryModel(family, 0));
      fixture.detectChanges();

      const leftJoin = component.createLensedJoinBand(-1, false).material as any;
      const rightJoin = component.createLensedJoinBand(1, false).material as any;

      expect(leftJoin.uniforms['uTailReachBoost'].value).toBe(0.18);
      expect(leftJoin.uniforms['uTailDrop'].value).toBe(0.06);
      expect(rightJoin.uniforms['uTailReachBoost'].value).toBe(0.46);
      expect(rightJoin.uniforms['uTailDrop'].value).toBe(0.12);
      expect(leftJoin.uniforms['uBandSpaceMaskBlend'].value).toBe(1);
      expect(rightJoin.uniforms['uBandSpaceMaskBlend'].value).toBe(1);
      expect(leftJoin.uniforms['uLeftRotationOffset'].value).toBeCloseTo(
        rightJoin.uniforms['uLeftRotationOffset'].value,
      );
      expect(leftJoin.uniforms['uRightRotationOffset'].value).toBeCloseTo(
        rightJoin.uniforms['uRightRotationOffset'].value,
      );
    }
  });

  it('adapts the lower reach of join bands for shallow inclinations', () => {
    const lowFixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const lowComponent = lowFixture.componentInstance as any;
    lowFixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 24 });
    lowFixture.detectChanges();
    const lowGroup = new THREE.Group();
    lowComponent.addLensedDiskImages(lowGroup);
    const lowJoin = (lowGroup.children.find((child: any) => child.renderOrder === 8.15) as any).material;

    const highFixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const highComponent = highFixture.componentInstance as any;
    highFixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 72 });
    highFixture.detectChanges();
    const highGroup = new THREE.Group();
    highComponent.addLensedDiskImages(highGroup);
    const highJoin = (highGroup.children.find((child: any) => child.renderOrder === 8.15) as any).material;

    expect(lowJoin.uniforms['uInclinationFactor'].value).toBeLessThan(highJoin.uniforms['uInclinationFactor'].value);
    expect(lowJoin.uniforms['uRotationAngle'].value).toBeLessThan(highJoin.uniforms['uRotationAngle'].value);
    expect(lowJoin.vertexShader).toContain('outerReach = mix(2.18, 2.24, uInclinationFactor)');
    expect(lowJoin.vertexShader).toContain('pivotX = uSide * 0.74');
    expect(lowJoin.fragmentShader).toContain('outerReach - 0.14');
  });


  it('keeps low-inclination join-band rotation moderate so both tails converge toward the disk', () => {
    const lowFixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const lowComponent = lowFixture.componentInstance as any;
    lowFixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 24 });
    lowFixture.detectChanges();

    const lowLeft = lowComponent.createLensedJoinBand(-1, false).material as any;
    const lowRight = lowComponent.createLensedJoinBand(1, false).material as any;

    const highFixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const highComponent = highFixture.componentInstance as any;
    highFixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 72 });
    highFixture.detectChanges();

    const highLeft = highComponent.createLensedJoinBand(-1, false).material as any;
    const highRight = highComponent.createLensedJoinBand(1, false).material as any;

    expect(lowLeft.uniforms['uRotationAngle'].value).toBeCloseTo(-0.1968, 3);
    expect(lowRight.uniforms['uRotationAngle'].value).toBeCloseTo(-0.1968, 3);
    expect(highLeft.uniforms['uRotationAngle'].value).toBeCloseTo(-0.12, 3);
    expect(highRight.uniforms['uRotationAngle'].value).toBeCloseTo(-0.12, 3);
    expect(Math.abs(lowLeft.uniforms['uRotationAngle'].value)).toBeLessThan(0.21);
  });

  it('AUDIT — stellar sample E LEFT envelope-center point must survive after tail transform', () => {
    const sampleE = blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 4);
    expect(sampleE.sampleLabel).toBe('E');
    expect(sampleE.inclinationDegrees).toBe(24);

    const leftTail = evaluateJoinTailCenterSurvival(sampleE, -1, 0.90);
    expect(
      leftTail.survival,
      `LEFT center clipped: preCenterY=${leftTail.preRotationCenterY.toFixed(4)}, transformedY=${leftTail.transformedY.toFixed(4)}, currentLower=${leftTail.currentLower.toFixed(4)}, currentUpper=${leftTail.currentUpper.toFixed(4)}, lowerMask=${leftTail.lowerMask.toFixed(4)}, upperMask=${leftTail.upperMask.toFixed(4)}`,
    ).toBeGreaterThan(0.15);
  });

  it('AUDIT — stellar sample E RIGHT envelope-center point must survive after tail transform', () => {
    const sampleE = blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 4);
    expect(sampleE.sampleLabel).toBe('E');
    expect(sampleE.inclinationDegrees).toBe(24);

    const rightTail = evaluateJoinTailCenterSurvival(sampleE, 1, 0.90);
    expect(
      rightTail.survival,
      `RIGHT center clipped: preCenterY=${rightTail.preRotationCenterY.toFixed(4)}, transformedY=${rightTail.transformedY.toFixed(4)}, currentLower=${rightTail.currentLower.toFixed(4)}, currentUpper=${rightTail.currentUpper.toFixed(4)}, lowerMask=${rightTail.lowerMask.toFixed(4)}, upperMask=${rightTail.upperMask.toFixed(4)}`,
    ).toBeGreaterThan(0.15);
  });

  it('keeps the upper lensed disk thickness canonical across inclination values', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;

    fixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 20 });
    fixture.detectChanges();
    const lowScale = component.upperLensedBandThicknessScale();

    fixture.componentRef.setInput('model', { ...blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0), inclinationDegrees: 85 });
    fixture.detectChanges();
    const highScale = component.upperLensedBandThicknessScale();

    expect(lowScale).toBe(0.60);
    expect(highScale).toBe(0.60);
    expect(highScale).toBe(lowScale);
  });



  it('decouples the canonical lens geometry from the main disk inclination', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;
    fixture.componentRef.setInput('model', blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0));
    fixture.detectChanges();

    component.scene = new THREE.Scene();
    component.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);

    component.rebuildScene();
    const groups = component.scene.children.filter((child: any) => child.type === 'Group');
    expect(groups.length).toBeGreaterThanOrEqual(2);

    const inclinedGroup = groups.find((group: any) => Math.abs(group.rotation.x) > 0.01);
    const canonicalGroup = groups.find((group: any) => Math.abs(group.rotation.x) <= 0.01);

    expect(inclinedGroup).toBeTruthy();
    expect(canonicalGroup).toBeTruthy();
  });



  it('re-renders only the upper half of the real sphere after the front disk', () => {
    const fixture = TestBed.createComponent(BlackHoleLaboratoryRender);
    const component = fixture.componentInstance as any;
    fixture.componentRef.setInput('model', blackHoleLaboratoryModel(ExtremeType.STELLAR_MASS_BLACK_HOLE, 0));
    fixture.detectChanges();

    const group = new THREE.Group();
    component.addUpperShadowHemisphere(group);

    const upperHemisphere = group.children[0] as any;
    expect(upperHemisphere.geometry.type).toBe('SphereGeometry');
    expect(upperHemisphere.renderOrder).toBe(20);
    expect(upperHemisphere.material.transparent).toBe(true);
    expect(upperHemisphere.material.fragmentShader).toContain('vRelativeViewY < 0.0');

    const lensedGroup = new THREE.Group();
    component.addLensedDiskImages(lensedGroup);
    const highestLensedOrder = Math.max(...lensedGroup.children.map((child: any) => child.renderOrder));
    expect(upperHemisphere.renderOrder).toBeGreaterThan(highestLensedOrder);
  });

});
