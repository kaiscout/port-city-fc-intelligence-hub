import type { ScenarioInput } from "../lib/types";
export function scenarioCurve(
  model: ScenarioInput,
  reference?: ScenarioInput,
): {
  result: ReturnType<typeof import("./model.js").calculateSeasonScenario>;
  points: { attendance: number; current: number; reference: number }[];
  minimum: number;
  maximum: number;
  capacity: number;
};
export function scenarioExplanation(model: ScenarioInput): string;
export function freeEntryExplanation(model: ScenarioInput): string;
export function scenarioOutcomeMarkup(model: ScenarioInput, reference: ScenarioInput): string;
export function mountScenarioChart(
  host: HTMLElement,
  model: ScenarioInput,
  reference?: ScenarioInput,
): { update(model: ScenarioInput, reference?: ScenarioInput): void; destroy(): void };
