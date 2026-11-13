import { describe, expect, it } from 'vitest';
import { LifeSpeciesVisualPreviewComponent } from './life-species-visual-preview';

describe('38.2o.e5c — galería exclusiva de Laboratorio', () => {
  it('oculta por defecto el acceso a la galería desde las fichas del juego', () => {
    const viewer = new LifeSpeciesVisualPreviewComponent();
    expect(viewer.showReptilianGalleryToggle).toBe(false);
  });

  it('conserva el visor y sus controles habituales', () => {
    const viewer = new LifeSpeciesVisualPreviewComponent();
    expect(viewer.moveMode).toBe(false);
    expect(viewer.paused).toBe(false);
    expect(typeof viewer.resetView).toBe('function');
    expect(typeof viewer.toggleMoveMode).toBe('function');
  });
});
