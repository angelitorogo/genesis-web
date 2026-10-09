import { TestBed } from '@angular/core/testing';
import { GreatStellarFlareOutcome } from '../../../../domain/transient/great-stellar-flare-event-profile';
import { GreatStellarFlareLaboratoryPage } from './great-stellar-flare-laboratory';
import { GreatStellarFlareLaboratoryCaseId } from './great-stellar-flare-laboratory-fixtures';


/** Localiza el valor visible por etiqueta; no depende del orden de las tarjetas. */
function metricText(element: HTMLElement, label: string): string {
  const row = Array.from(element.querySelectorAll('.flare-lab__metrics > div'))
    .find(item => item.querySelector('dt')?.textContent?.trim() === label);
  if (!row) throw new Error(`No se encontró la métrica 29.9: ${label}`);
  return (row.querySelector('dd')?.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function scientificNote(element: HTMLElement): string {
  const note = element.querySelector('[data-testid="great-stellar-flare-scientific-note"]');
  if (!note) throw new Error('Falta la nota científica 29.9');
  return (note.textContent ?? '').replace(/\s+/g, ' ').trim();
}

const eventDependentLabels = [
  'Energía del evento',
  'Duración fuente',
  'Potencia media',
  'Duración equivalente E/L★',
  'E / típica',
  'E / máximo 15.4',
  'Pmedia / L★',
  'Próxima llamarada',
  'Pico / curva de luz',
  'CME / partículas',
  'Fluencia / flujo observado',
  'Dosis / impacto planetario',
] as const;

describe('GreatStellarFlareLaboratoryPage 29.9', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GreatStellarFlareLaboratoryPage] }).compileComponents();
  });

  it('renders the five deterministic large-flare boundary cases', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.cases.map(item => item.id)).toEqual([
      GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE,
      GreatStellarFlareLaboratoryCaseId.SOLAR_TYPE_LARGE_FLARE,
      GreatStellarFlareLaboratoryCaseId.YOUNG_K_SUPERFLARE,
      GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY,
      GreatStellarFlareLaboratoryCaseId.COMPACT_REMNANT_BOUNDARY,
    ]);
    expect(element.querySelector('[data-testid="great-stellar-flare-event-diagram"]')).toBeTruthy();
    expect(element.textContent).toContain('Grandes llamaradas estelares');
  });

  it('shows an explicit M-dwarf superflare without inventing peak light curve or planetary dose', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    fixture.detectChanges();
    const profile = fixture.componentInstance.selectedCase().profile;
    const element = fixture.nativeElement as HTMLElement;

    expect(profile.outcome).toBe(GreatStellarFlareOutcome.EXPLICIT_LARGE_STELLAR_FLARE);
    expect(profile.energyToTypicalRatio).toBeCloseTo(50, 10);
    expect(profile.peakFlareLuminosityWatts).toBeNull();
    expect(profile.planetaryIncidentEnergyJoulesPerSquareMeter).toBeNull();
    expect(element.querySelector('[data-testid="great-stellar-flare-energy-baseline"]')).toBeTruthy();
    expect(element.textContent).toContain('No inferida desde una tasa media');
  });

  it('keeps a point-15.4 active star statistical until an individual flare is explicit', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY);
    fixture.detectChanges();
    const profile = component.selectedCase().profile;
    const element = fixture.nativeElement as HTMLElement;

    expect(profile.outcome).toBe(GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT);
    expect(profile.source.activityProfile.hasModeledFlares).toBe(true);
    expect(profile.source.flareEnergyJoules).toBeNull();
    expect(profile.nextFlareTimeSeconds).toBeNull();
    expect(element.querySelector('[data-testid="great-stellar-flare-statistical-only"]')).toBeTruthy();
    expect(element.textContent).toContain('Una estrella activa no implica una llamarada ahora');
  });

  it('keeps compact-remnant magnetic bursts outside ordinary 29.9 stellar flares', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GreatStellarFlareLaboratoryCaseId.COMPACT_REMNANT_BOUNDARY);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.selectedCase().profile.outcome)
      .toBe(GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE);
    expect(element.querySelector('[data-testid="great-stellar-flare-not-applicable"]')).toBeTruthy();
    expect(element.textContent).toContain('Los bursts de magnetar no son llamaradas estelares ordinarias');
  });

  it('keeps 29.9 separated from compact-remnant bursts and future planetary-effects accounting', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('[data-testid="great-stellar-flare-channel-boundary"]')?.textContent)
      .toContain('27.6/29.8');
    expect(element.querySelector('[data-testid="great-stellar-flare-channel-boundary"]')?.textContent)
      .toContain('29.11');
  });

  it('29.9a keeps resolved event values and their unresolved observables unchanged in all three explicit flares', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;
    for (const [id, energy, duration] of [
      [GreatStellarFlareLaboratoryCaseId.M_DWARF_SUPERFLARE, 1e27, '1 h'],
      [GreatStellarFlareLaboratoryCaseId.SOLAR_TYPE_LARGE_FLARE, 4e25, '30 min'],
      [GreatStellarFlareLaboratoryCaseId.YOUNG_K_SUPERFLARE, 2.5e26, '40 min'],
    ] as const) {
      component.selectCase(id);
      fixture.detectChanges();
      expect(component.selectedCase().profile.outcome)
        .toBe(GreatStellarFlareOutcome.EXPLICIT_LARGE_STELLAR_FLARE);
      expect(component.selectedCase().profile.source.flareEnergyJoules).toBe(energy);
      expect(metricText(element, 'Energía del evento')).toContain('J');
      expect(metricText(element, 'Duración fuente')).toBe(duration);
      expect(metricText(element, 'Pico / curva de luz')).toBe('No resueltos');
      expect(metricText(element, 'CME / partículas')).toBe('No resueltos');
      expect(metricText(element, 'Fluencia / flujo observado')).toBe('No resueltos');
      expect(metricText(element, 'Dosis / impacto planetario')).toBe('No resuelto en 29.9');
      expect(metricText(element, 'Próxima llamarada')).toBe('No inferida desde una tasa media');
      expect(scientificNote(element)).toContain('esta llamarada explícita');
      expect(scientificNote(element)).not.toContain('Solo existe un perfil estadístico');
    }
  });

  it('29.9a labels all event-dependent fields non-evaluable without a resolved individual flare while retaining 15.4 statistics', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GreatStellarFlareLaboratoryCaseId.STATISTICAL_ACTIVITY_ONLY);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.selectedCase().profile.outcome)
      .toBe(GreatStellarFlareOutcome.STATISTICAL_ACTIVITY_WITHOUT_EVENT);
    expect(metricText(element, 'Energía típica 15.4')).toContain('J');
    expect(metricText(element, 'Energía máxima 15.4')).toContain('J');
    expect(metricText(element, 'Tasa de flares')).toContain('media estadística');
    for (const label of eventDependentLabels) {
      expect(metricText(element, label)).toBe('No evaluables: no hay evento individual');
    }
    expect(scientificNote(element)).toContain('Solo existe un perfil estadístico de actividad 15.4');
    expect(scientificNote(element)).toContain('Tampoco permiten programar la próxima llamarada');
    expect(scientificNote(element)).not.toContain('esta llamarada explícita');
  });

  it('29.9a marks the entire ordinary-flare model non-applicable to compact remnants, never merely unresolved', () => {
    const fixture = TestBed.createComponent(GreatStellarFlareLaboratoryPage);
    const component = fixture.componentInstance;
    component.selectCase(GreatStellarFlareLaboratoryCaseId.COMPACT_REMNANT_BOUNDARY);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(component.selectedCase().profile.outcome)
      .toBe(GreatStellarFlareOutcome.ORDINARY_STELLAR_FLARE_MODEL_NOT_APPLICABLE);
    for (const label of [
      'Radio / luminosidad',
      'Régimen de actividad',
      'Índice magnético 15.4',
      'Tasa de flares',
      'Energía típica 15.4',
      'Energía máxima 15.4',
      ...eventDependentLabels,
    ]) {
      expect(metricText(element, label)).toBe('No aplica');
    }
    expect(metricText(element, 'Estado 29.9')).toContain('No aplica a remanente compacto');
    expect(scientificNote(element)).toContain('no aplica a este remanente compacto');
    expect(scientificNote(element)).toContain('canales especializados');
    expect(scientificNote(element)).not.toContain('esta llamarada explícita');
    expect(scientificNote(element)).not.toContain('Solo existe un perfil estadístico');
  });

});
