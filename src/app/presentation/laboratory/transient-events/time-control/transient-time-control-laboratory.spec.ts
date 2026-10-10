import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TransientTimeControlLaboratoryPage } from './transient-time-control-laboratory';

describe('29.12 time-control laboratory', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({imports:[TransientTimeControlLaboratoryPage]}).compileComponents();
  });
  it('renders eleven reference cases with simulation mode and zero persisted events', () => {
    const fixture=TestBed.createComponent(TransientTimeControlLaboratoryPage);
    fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('.time-lab__cases button')).toHaveLength(11);
    expect(root.textContent).toContain('simulación manual');
    expect(root.querySelector('[data-testid="time-control-persisted"]')?.textContent).toBe('0');
    expect(root.querySelector('[data-testid="transient-time-control-laboratory"]')).toBeTruthy();
  });
  it('advances by user action and resets reproducibly', () => {
    const fixture=TestBed.createComponent(TransientTimeControlLaboratoryPage);
    fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="time-control-step"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(root.textContent).toContain('1 min');
    (root.querySelector('[data-testid="time-control-reset"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.report().simulationSeconds).toBe(0);
  });
  it('samples Date.now only for explicitly authorized actions, never for pure projections', () => {
    const fixture = TestBed.createComponent(TransientTimeControlLaboratoryPage);
    fixture.detectChanges();
    const page = fixture.componentInstance;
    // Spy only around the component API, not Angular detectChanges():
    // Angular/Vitest may consult the global clock themselves while rendering.
    const spy = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      expect(page.report().simulationSeconds).toBe(0);
      expect(spy).not.toHaveBeenCalled();

      page.authorizeBrowserClock();
      const linked = page.clock();
      expect(linked.mode).toBe('EXPLICIT_WALL_SAMPLE');
      expect(linked.mode === 'EXPLICIT_WALL_SAMPLE' ? linked.anchorEpochMilliseconds : null).toBe(1_000_000);
      expect(page.report().simulationSeconds).toBe(0);

      spy.mockReturnValue(1_005_000);
      page.sampleBrowserClock();
      const sampled = page.clock();
      expect(sampled.mode === 'EXPLICIT_WALL_SAMPLE' ? sampled.sampledEpochMilliseconds : null).toBe(1_005_000);
      expect(page.report().simulationSeconds).toBe(5);

      page.unlinkBrowserClock();
      expect(page.clock().mode).toBe('SIMULATED');
      expect(page.report().simulationSeconds).toBe(5);

      // Sampling without explicit authorization is inert and does not change state.
      spy.mockReturnValue(2_000_000);
      page.sampleBrowserClock();
      expect(page.clock().mode).toBe('SIMULATED');
      expect(page.report().simulationSeconds).toBe(5);
    } finally {
      spy.mockRestore();
    }
  });
  it('wires the browser-clock buttons to explicit samples without implicit advancement', () => {
    const fixture = TestBed.createComponent(TransientTimeControlLaboratoryPage);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const page = fixture.componentInstance;
    expect(page.report().simulationSeconds).toBe(0);

    // Mock a stable timestamp during the synchronous DOM click. Do not count
    // global Date.now calls here: the rendering framework shares that API.
    const anchorSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    try {
      (root.querySelector('[data-testid="time-control-authorize-wall"]') as HTMLButtonElement).click();
    } finally {
      anchorSpy.mockRestore();
    }
    fixture.detectChanges();
    expect(page.clock().mode).toBe('EXPLICIT_WALL_SAMPLE');
    expect(page.report().simulationSeconds).toBe(0);
    fixture.detectChanges();
    expect(page.report().simulationSeconds).toBe(0);

    const sampleSpy = vi.spyOn(Date, 'now').mockReturnValue(1_005_000);
    try {
      (root.querySelector('[data-testid="time-control-sample-wall"]') as HTMLButtonElement).click();
    } finally {
      sampleSpy.mockRestore();
    }
    fixture.detectChanges();
    expect(page.report().simulationSeconds).toBe(5);
    fixture.detectChanges();
    expect(page.report().simulationSeconds).toBe(5);

    (root.querySelector('[data-testid="time-control-unlink-wall"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(page.clock().mode).toBe('SIMULATED');
    expect(page.report().simulationSeconds).toBe(5);
    expect(root.textContent).toContain('simulación manual');
  });
  it('does not create observations when switching to the future-merger case', () => {
    const fixture=TestBed.createComponent(TransientTimeControlLaboratoryPage);
    fixture.detectChanges();
    const root=fixture.nativeElement as HTMLElement;
    (root.querySelector('[data-testid="time-control-case-future"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    fixture.componentInstance.nextMilestone();
    fixture.detectChanges();
    expect(root.textContent).toContain('Predicción vencida · suceso SIN confirmar');
    expect(fixture.componentInstance.report().newObservations).toBe(0);
  });
});
