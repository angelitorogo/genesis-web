export interface GasEnvelopeBudgetRequestV1 {
  readonly targetEnvelopeMassEarth: number;
  readonly runawayReadiness01: number;
}

const V1_RUNAWAY_PRIORITY_ONSET =
  0.01;

const V1_RUNAWAY_PRIORITY_FULL =
  0.35;

const V1_RUNAWAY_PRIORITY_MAX_EXTRA_WEIGHT =
  4;

/**
 * Finite-system gas-budget allocator for point 19.2.
 *
 * Ordinary non-runaway systems preserve the exact historical proportional
 * normalization. When one or more mature cores have genuine runaway readiness,
 * only the scarce-budget allocation changes: ready cores receive a smooth,
 * bounded priority while every body stays capped by its own physical target and
 * the sum can never exceed the frozen point-17.7 system budget.
 *
 * This function does not create gas, change per-body capacity, or assign a
 * PlanetType. It only decides how an already-frozen finite budget is shared.
 */
export function allocateGasEnvelopeBudgetV1(
  requests: readonly GasEnvelopeBudgetRequestV1[],
  availableEnvelopeMassEarth: number,
): readonly number[] {

  if (
    requests.length === 0 ||
    availableEnvelopeMassEarth <= 0
  ) {
    return Object.freeze(
      requests.map(() => 0),
    );
  }

  const targets =
    requests.map(request =>
      Math.max(
        0,
        request.targetEnvelopeMassEarth,
      ),
    );

  const totalTarget =
    targets.reduce(
      (sum, value) => sum + value,
      0,
    );

  if (totalTarget <= 0) {
    return Object.freeze(
      requests.map(() => 0),
    );
  }

  if (
    totalTarget <=
    availableEnvelopeMassEarth
  ) {
    return Object.freeze(
      [...targets],
    );
  }

  const strongestRunawayReadiness01 =
    Math.max(
      0,
      ...requests.map(request =>
        clamp01(
          request.runawayReadiness01,
        ),
      ),
    );

  /*
   * Preserve the historical branch bit-for-bit for systems with no runaway
   * candidate. This keeps the rebalancing tightly scoped to the diagnosed
   * giant-planet bottleneck.
   */
  if (
    strongestRunawayReadiness01 <= 0
  ) {
    const budgetScale =
      availableEnvelopeMassEarth /
      totalTarget;

    return Object.freeze(
      targets.map(target =>
        target *
        budgetScale,
      ),
    );
  }

  const weights =
    requests.map(
      (
        request,
        index,
      ) => {
        const priority01 =
          smoothstep01(
            V1_RUNAWAY_PRIORITY_ONSET,
            V1_RUNAWAY_PRIORITY_FULL,
            clamp01(
              request.runawayReadiness01,
            ),
          );

        const priorityMultiplier =
          1 +
          V1_RUNAWAY_PRIORITY_MAX_EXTRA_WEIGHT *
            priority01;

        /*
         * Multiplying the existing physical target by a bounded priority keeps
         * ordinary demand relevant while letting a genuinely runaway core
         * monopolize more of a scarce disk reservoir, as core accretion
         * requires once runaway starts.
         */
        return (
          targets[index] *
          priorityMultiplier
        );
      },
    );

  return Object.freeze(
    cappedWeightedAllocation(
      targets,
      weights,
      availableEnvelopeMassEarth,
    ),
  );
}

function cappedWeightedAllocation(
  caps: readonly number[],
  weights: readonly number[],
  budget: number,
): number[] {

  const allocation =
    caps.map(() => 0);

  const active =
    new Set(
      caps
        .map((cap, index) => ({ cap, index }))
        .filter(value => value.cap > 0)
        .map(value => value.index),
    );

  let remainingBudget =
    Math.max(
      0,
      budget,
    );

  while (
    active.size > 0 &&
    remainingBudget > 1e-12
  ) {
    const activeWeight =
      [...active].reduce(
        (sum, index) =>
          sum +
          Math.max(
            0,
            weights[index],
          ),
        0,
      );

    if (
      activeWeight <= 0
    ) {
      break;
    }

    const saturated: number[] =
      [];

    for (const index of active) {
      const proposed =
        remainingBudget *
        Math.max(
          0,
          weights[index],
        ) /
        activeWeight;

      const remainingCap =
        caps[index] -
        allocation[index];

      if (
        proposed >=
        remainingCap -
          1e-12
      ) {
        allocation[index] +=
          remainingCap;

        remainingBudget -=
          remainingCap;

        saturated.push(index);
      }
    }

    if (
      saturated.length > 0
    ) {
      for (const index of saturated) {
        active.delete(index);
      }

      continue;
    }

    for (const index of active) {
      allocation[index] +=
        remainingBudget *
        Math.max(
          0,
          weights[index],
        ) /
        activeWeight;
    }

    remainingBudget =
      0;
  }

  return allocation;
}

function smoothstep01(
  lower: number,
  upper: number,
  value: number,
): number {

  if (value <= lower) {
    return 0;
  }

  if (value >= upper) {
    return 1;
  }

  const x =
    (value - lower) /
    (upper - lower);

  return (
    x *
    x *
    (3 - 2 * x)
  );
}

function clamp01(
  value: number,
): number {

  return Math.min(
    1,
    Math.max(
      0,
      value,
    ),
  );
}
