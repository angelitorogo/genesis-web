import { TestBed } from '@angular/core/testing';
import {
  ArchiveGalacticObjectKnowledgeLevel as Level,
  ArchiveGalacticObjectRenderKind as Kind,
  ArchiveGalacticObjectRenderProfile as Profile,
  type ArchiveGalacticObjectRenderDescriptor,
} from './archive-galactic-object-card';
import { GalacticObjectProceduralRender } from './galactic-object-procedural-render';

const descriptor = (
  kind: 'OPEN' | 'GLOBULAR',
  level: Level,
): ArchiveGalacticObjectRenderDescriptor => Object.freeze({
  kind: level === Level.SIGNAL ? Kind.STAR_CLUSTER
    : kind === 'OPEN' ? Kind.OPEN_CLUSTER : Kind.GLOBULAR_CLUSTER,
  renderProfile: kind === 'OPEN' ? Profile.OPEN_CLUSTER_FIELD : Profile.GLOBULAR_CLUSTER_FIELD,
  knowledgeLevel: level,
  seed: 'PHASE-26-7-CONFIRMED-ROUTING-V2',
  accessibleLabel: 'Representación científica de cúmulo',
  variant: null,
  scale: 0.55,
  density: 0.65,
  energy: 0.6,
  concentration: 0.7,
});

describe('26.7 — cluster 3D disclosure and component reuse V2', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [GalacticObjectProceduralRender] }).compileComponents();
  });

  for (const kind of ['OPEN', 'GLOBULAR'] as const) {
    it(`${kind}: preserves existing renderer until CONFIRMED, then mounts the 3D wrapper in the same figure`, () => {
      const fixture = TestBed.createComponent(GalacticObjectProceduralRender);
      const root = fixture.nativeElement as HTMLElement;
      for (const level of [Level.SIGNAL, Level.IDENTIFIED, Level.CATALOGUED]) {
        fixture.componentRef.setInput('descriptor', descriptor(kind, level));
        fixture.detectChanges();
        expect(root.querySelector('app-confirmed-cluster-render')).toBeNull();
        expect(root.querySelector(kind === 'OPEN'
          ? '[data-testid="open-cluster-render"]'
          : '[data-testid="globular-cluster-render"]')).not.toBeNull();
      }
      fixture.componentRef.setInput('descriptor', descriptor(kind, Level.CONFIRMED));
      fixture.detectChanges();
      const confirmed = root.querySelector('[data-testid="confirmed-cluster-3d-render"]') as HTMLElement | null;
      expect(confirmed).not.toBeNull();
      expect(confirmed?.getAttribute('data-cluster-kind')).toContain(kind);
      fixture.componentRef.setInput('descriptor', descriptor(kind, Level.CATALOGUED));
      fixture.detectChanges();
      expect(root.querySelector('app-confirmed-cluster-render')).toBeNull();
      fixture.destroy();
    });
  }
});
