/** 37.A: qualitative technological capabilities derived strictly from VIDA.7.
 * These are NOT instrumentally observed emissions and do not alter VIDA.7/8/9.
 * Visible illumination, satellites and distant detection belong to 38/37.B. */
import type { Vida7Civilization, Vida7CivilizationTier } from './vida7-intelligence-civilizations';

export type Technosignature37aRadio = 'NONE' | 'POSSIBLE' | 'EXTENDED_POSSIBLE';
export type Technosignature37aNightLight = 'LOCAL_POSSIBLE' | 'URBAN_POSSIBLE' | 'EXTENSIVE_POSSIBLE';

export interface Technosignature37aProfile {
  readonly tier: Vida7CivilizationTier;
  readonly radio: Technosignature37aRadio;
  readonly nightLight: Technosignature37aNightLight;
  /** Local in-system, confirmed-knowledge alert; never a remote detection. */
  readonly sceneAlert: boolean;
  /** The profile never asserts an actual intercepted transmission. */
  readonly observedRadioSignal: false;
}

export function technosignatureProfile37a(
  civilization: Pick<Vida7Civilization, 'tier'>,
): Technosignature37aProfile {
  switch (civilization.tier) {
    case 'PRIMITIVE':
      return Object.freeze({tier:'PRIMITIVE',radio:'NONE',
        nightLight:'LOCAL_POSSIBLE',sceneAlert:false,observedRadioSignal:false});
    case 'ADVANCED':
      return Object.freeze({tier:'ADVANCED',radio:'POSSIBLE',
        nightLight:'URBAN_POSSIBLE',sceneAlert:true,observedRadioSignal:false});
    case 'VERY_ADVANCED':
      return Object.freeze({tier:'VERY_ADVANCED',radio:'EXTENDED_POSSIBLE',
        nightLight:'EXTENSIVE_POSSIBLE',sceneAlert:true,observedRadioSignal:false});
  }
}

/** Several homeworlds in the same system give ONE warning, strongest level first.
 * The result deliberately contains no planet, moon or species identity. */
export function systemTechnosignatureAlert37a(
  profiles: readonly Technosignature37aProfile[],
): 'ADVANCED' | 'VERY_ADVANCED' | null {
  if (profiles.some(profile=>profile.sceneAlert && profile.tier==='VERY_ADVANCED')) return 'VERY_ADVANCED';
  if (profiles.some(profile=>profile.sceneAlert && profile.tier==='ADVANCED')) return 'ADVANCED';
  return null;
}
