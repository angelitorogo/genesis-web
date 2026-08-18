import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  GalaxyFocusTransitionRuntime,
} from '../runtime/galaxy-focus-transition.runtime';

import {
  GalaxyFocusTransition,
} from './galaxy-focus-transition';

describe('GalaxyFocusTransition', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it(
    'should remain absent until a persisted focus change is explicitly presented',
    () => {
      const fixture =
        TestBed
          .createComponent(
            GalaxyFocusTransition,
          );

      fixture.detectChanges();

      const element =
        fixture
          .nativeElement as
          HTMLElement;

      expect(
        element
          .querySelector(
            '[data-testid="galaxy-focus-transition"]',
          ),
      ).toBeNull();
    },
  );

  it(
    'should render the point-11.7 reorientation without asserting physical or FTL travel',
    () => {
      const fixture =
        TestBed
          .createComponent(
            GalaxyFocusTransition,
          );

      const runtime =
        TestBed
          .inject(
            GalaxyFocusTransitionRuntime,
          );

      runtime
        .presentPersistedFocusChange({
          previousFocusGalaxyIndex:
            0n,

          activeGalaxyIndex:
            7n,
        });

      fixture.detectChanges();

      const element =
        fixture
          .nativeElement as
          HTMLElement;

      const transition =
        element
          .querySelector<HTMLElement>(
            '[data-testid="galaxy-focus-transition"]',
          );

      expect(
        transition,
      ).not.toBeNull();

      expect(
        transition
          ?.getAttribute(
            'data-from-galaxy',
          ),
      ).toBe(
        '0',
      );

      expect(
        transition
          ?.getAttribute(
            'data-to-galaxy',
          ),
      ).toBe(
        '7',
      );

      expect(
        transition
          ?.textContent,
      ).toContain(
        'REORIENTANDO EXPLORACIÓN',
      );

      expect(
        transition
          ?.textContent,
      ).toContain(
        'no representa desplazamiento físico ni viaje FTL',
      );
    },
  );

  it(
    'should reject a transition that does not actually change galaxy focus',
    () => {
      const runtime =
        TestBed
          .inject(
            GalaxyFocusTransitionRuntime,
          );

      expect(
        () =>
          runtime
            .presentPersistedFocusChange({
              previousFocusGalaxyIndex:
                4n,

              activeGalaxyIndex:
                4n,
            }),
      ).toThrowError(
        RangeError,
      );
    },
  );

  it(
    'should clear the global overlay automatically after its presentation window',
    () => {
      vi.useFakeTimers();

      const fixture =
        TestBed
          .createComponent(
            GalaxyFocusTransition,
          );

      const runtime =
        TestBed
          .inject(
            GalaxyFocusTransitionRuntime,
          );

      const transition =
        runtime
          .presentPersistedFocusChange({
            previousFocusGalaxyIndex:
              2n,

            activeGalaxyIndex:
              5n,
          });

      fixture.detectChanges();

      expect(
        runtime
          .state()
          .kind,
      ).toBe(
        'active',
      );

      vi.advanceTimersByTime(
        transition
          .durationMs +
        120,
      );

      fixture.detectChanges();

      expect(
        runtime
          .state()
          .kind,
      ).toBe(
        'idle',
      );
    },
  );
});
