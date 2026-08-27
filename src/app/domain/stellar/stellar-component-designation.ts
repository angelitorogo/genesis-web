import {
  type StellarDesignation,
} from './stellar-designation';

import {
  type StellarSystemComponentLabel,
} from './stellar-system-component-label';

/**
 * Component-level label layered over the frozen point-15.6 system designation.
 *
 * It deliberately does not rename the SystemLocator target. "Jotheria" remains
 * the system/base designation while "Jotheria A" and "Jotheria B" identify
 * stellar components inside that system.
 */
export class StellarComponentDesignation {

  readonly name:
    string;

  readonly proceduralCode:
    string;

  constructor(
    readonly systemDesignation:
      StellarDesignation,

    readonly componentLabel:
      StellarSystemComponentLabel,
  ) {
    this.name =
      `${systemDesignation.name} ${componentLabel.name}`;

    this.proceduralCode =
      `${systemDesignation.proceduralCode}-${componentLabel.name}`;
  }
}
