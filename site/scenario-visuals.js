import { calculateSeasonScenario } from "./model.js";

const usd = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const count = (n) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);
const compact = (n) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
const safe = (s) =>
  String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");

/** Every plotted point is an evaluation of the production scenario equation. */
export function scenarioCurve(model, reference = model) {
  const result = calculateSeasonScenario(model);
  const capacity = model.venueCapacity;
  const sample = new Set(Array.from({ length: 41 }, (_, i) => (capacity * i) / 40));
  sample.add(result.attendance);
  if (result.breakEven !== null && result.breakEven <= capacity) sample.add(result.breakEven);
  if (reference.venueCapacity < capacity) sample.add(reference.venueCapacity);
  const points = [...sample]
    .sort((a, b) => a - b)
    .map((attendance) => ({
      attendance,
      current: calculateSeasonScenario({ ...model, expectedAttendance: attendance }).contribution,
      reference: calculateSeasonScenario({ ...reference, expectedAttendance: attendance })
        .contribution,
    }));
  const values = points.flatMap((point) => [point.current, point.reference]);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  const pad = Math.max((high - low) * 0.14, 1);
  return { result, points, minimum: low - pad, maximum: high + pad, capacity };
}

export function scenarioExplanation(model) {
  const r = calculateSeasonScenario(model);
  const start = calculateSeasonScenario({ ...model, expectedAttendance: 0 }).contribution;
  const end = calculateSeasonScenario({
    ...model,
    expectedAttendance: model.venueCapacity,
  }).contribution;
  if (end <= start)
    return "More attendance does not improve this case. Review ticket income, attendee costs and allowances.";
  if (r.breakEven === null)
    return "These settings cannot reach break-even. Review prices, costs or sponsorship.";
  if (!r.feasible)
    return `Break-even needs ${count(r.breakEven)} fans per match, above the ${count(model.venueCapacity)} capacity.`;
  const difference = r.attendance - r.breakEven;
  if (r.contribution < 0)
    return `${count(Math.max(0, -difference))} more fans per home match are needed to reach break-even.`;
  if (r.breakEven === 0)
    return "Sponsorship covers the fixed costs at zero attendance. The chart shows what additional fans contribute.";
  return `${count(difference)} fans above break-even per home match at these settings.`;
}

/** Stable SVG nodes retain focus and allow marker/line transitions during input. */
export function mountScenarioChart(host, initialModel, initialReference = initialModel) {
  let model = initialModel;
  let reference = initialReference;
  let plot;
  let inspected = null;
  const width = 640,
    height = 296;
  const left = 64,
    right = 24,
    top = 44,
    bottom = 46;
  host.innerHTML = `<div class="lab-chart-heading"><div><span class="lab-eyebrow">Attendance sensitivity</span><h3>What Changes as More Fans Attend?</h3></div><span class="lab-live"><i></i>Live</span></div>
    <div class="lab-chart-legend"><span><i class="chart-current"></i><span data-node="current-legend"></span></span><span><i class="chart-baseline"></i><span data-node="reference-legend"></span></span></div>
    <svg class="lab-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Contribution after costs and allowances, by total attendance per home match">
      <title>Attendance and contribution</title><desc>Solid line: current inputs. Dashed line: starting case. The dot marks current attendance. Use the inspection slider below for exact values.</desc>
      <rect data-node="positive" class="plot-surplus" x="${left}" width="${width - left - right}"/>
      <rect data-node="negative" class="plot-shortfall" x="${left}" width="${width - left - right}"/>
      ${Array.from({ length: 5 }, (_, i) => `<g><line data-node="grid-${i}" class="plot-grid" x1="${left}" x2="${width - right}"/><text data-node="y-${i}" class="plot-label" x="${left - 10}" text-anchor="end"/></g>`).join("")}
      <line data-node="zero" class="plot-zero" x1="${left}" x2="${width - right}"/>
      <path data-node="reference" class="plot-reference" fill="none"/>
      <path data-node="current" class="plot-current" fill="none"/>
      <line data-node="threshold" class="plot-threshold" y1="${top}" y2="${height - bottom}"/>
      <text data-node="threshold-label" class="plot-threshold-label" y="34"/>
      <circle data-node="marker-halo" r="12" class="plot-marker-halo"/>
      <circle data-node="marker" r="5" class="plot-marker"/>
      <line data-node="inspect-line" class="plot-inspect" y1="${top}" y2="${height - bottom}"/>
      <circle data-node="inspect-marker" r="4" class="plot-inspect-marker"/>
      ${Array.from({ length: 5 }, (_, i) => `<text data-node="x-${i}" class="plot-label" y="${height - bottom + 22}" text-anchor="middle"/>`).join("")}
      <text class="plot-axis" x="${(left + width - right) / 2}" y="${height - 3}" text-anchor="middle">Total fans per home match</text>
      <text data-node="scope" class="plot-axis" x="${left}" y="16"/>
    </svg>
    <div class="lab-chart-insight"><span data-node="inspect-value"></span><span data-node="inspect-note">Move over the graph to explore</span></div>
    <label class="lab-inspection"><span>Explore Attendance <output data-node="inspect-count"></output></span><input type="range" min="0" step="1" data-chart-inspect aria-label="Explore chart attendance"/><small>Explore the line without changing your plan.</small></label>`;
  const node = (name) => host.querySelector(`[data-node="${name}"]`);
  const attr = (name, values) => {
    const el = node(name);
    for (const [key, value] of Object.entries(values)) el.setAttribute(key, String(value));
  };
  const x = (n) => left + (n / plot.capacity) * (width - left - right);
  const y = (n) =>
    top + ((plot.maximum - n) / (plot.maximum - plot.minimum)) * (height - top - bottom);
  const inspect = (attendance) => {
    const a = Math.min(model.venueCapacity, Math.max(0, attendance));
    const r = calculateSeasonScenario({ ...model, expectedAttendance: a });
    attr("inspect-line", { x1: x(a), x2: x(a) });
    attr("inspect-marker", { cx: x(a), cy: y(r.contribution) });
    node("inspect-value").textContent = `${count(a)} fans · ${usd(r.contribution)} contribution`;
    node("inspect-note").textContent =
      `${model.homeMatches === 1 ? "Per home match" : `${model.homeMatches} home matches`} · before shared overhead`;
    node("inspect-count").textContent = count(a);
    host.querySelector("[data-chart-inspect]").value = String(Math.round(a));
  };
  const update = (nextModel, nextReference = reference) => {
    model = nextModel;
    reference = nextReference;
    plot = scenarioCurve(model, reference);
    const zero = y(0);
    attr("positive", { y: top, height: Math.max(0, zero - top) });
    attr("negative", { y: zero, height: Math.max(0, height - bottom - zero) });
    attr("zero", { y1: zero, y2: zero });
    for (let i = 0; i < 5; i++) {
      const v = plot.minimum + ((plot.maximum - plot.minimum) * i) / 4;
      const at = (model.venueCapacity * i) / 4;
      attr(`grid-${i}`, { y1: y(v), y2: y(v) });
      attr(`y-${i}`, { y: y(v) + 4 });
      node(`y-${i}`).textContent = `${v < 0 ? "−" : ""}$${compact(Math.abs(v))}`;
      attr(`x-${i}`, { x: x(at) });
      node(`x-${i}`).textContent = compact(at);
    }
    for (const key of ["current", "reference"]) {
      attr(key, {
        d: plot.points
          .map((p, i) => `${i ? "L" : "M"}${x(p.attendance).toFixed(2)},${y(p[key]).toFixed(2)}`)
          .join(" "),
      });
    }
    for (const name of ["marker", "marker-halo"])
      attr(name, { cx: x(plot.result.attendance), cy: y(plot.result.contribution) });
    const zeroAttendance = plot.points[0].current;
    const fullAttendance = plot.points.at(-1).current;
    const falling = fullAttendance < zeroAttendance;
    const flat = fullAttendance === zeroAttendance;
    // A funded declining case can have a minimum attendance of zero but a later
    // loss boundary. Mark the actual crossing, rather than calling zero surplus.
    const crossing = falling
      ? (-zeroAttendance * model.venueCapacity) / (fullAttendance - zeroAttendance)
      : null;
    const threshold = falling
      ? crossing >= 0 && crossing <= model.venueCapacity
        ? crossing
        : null
      : flat || zeroAttendance > 0
        ? null
        : plot.result.breakEven;
    const shown = threshold !== null && threshold <= model.venueCapacity;
    attr("threshold", {
      x1: x(threshold ?? 0),
      x2: x(threshold ?? 0),
      visibility: shown ? "visible" : "hidden",
    });
    attr("threshold-label", {
      x: shown ? Math.min(width - right, Math.max(left + 90, x(threshold))) : width - right,
      "text-anchor": "end",
    });
    node("threshold-label").textContent = shown
      ? falling
        ? `Loss boundary ≈ ${count(threshold)} fans`
        : `Break-even ${count(threshold)}`
      : flat
        ? "Contribution is unchanged by attendance"
        : zeroAttendance > 0 && !falling
          ? "Fixed costs covered by sponsorship"
          : "No break-even within capacity";
    node("scope").textContent = "Plan contribution after costs (USD)";
    const scopeLabel = (m) => `${m.homeMatches} home ${m.homeMatches === 1 ? "match" : "matches"}`;
    node("current-legend").textContent = `Current Case · ${scopeLabel(model)}`;
    node("reference-legend").textContent = `Starting Case · ${scopeLabel(reference)}`;
    host.querySelector("[data-chart-inspect]").max = String(model.venueCapacity);
    inspect(inspected === null ? plot.result.attendance : Math.min(inspected, model.venueCapacity));
  };
  const svg = host.querySelector("svg");
  const onPointer = (event) => {
    const box = svg.getBoundingClientRect();
    const point = ((event.clientX - box.left) / box.width) * width;
    inspected = Math.round(
      Math.max(
        0,
        Math.min(plot.capacity, ((point - left) / (width - left - right)) * plot.capacity),
      ),
    );
    inspect(inspected);
  };
  const onLeave = () => {
    inspected = null;
    inspect(plot.result.attendance);
  };
  const onInput = (event) => {
    inspected = Number(event.target.value);
    inspect(inspected);
  };
  svg.addEventListener("pointermove", onPointer);
  svg.addEventListener("pointerleave", onLeave);
  host.querySelector("[data-chart-inspect]").addEventListener("input", onInput);
  update(model, reference);
  return {
    update,
    destroy() {
      svg.removeEventListener("pointermove", onPointer);
      svg.removeEventListener("pointerleave", onLeave);
      host.querySelector("[data-chart-inspect]")?.removeEventListener("input", onInput);
    },
  };
}

export function freeEntryExplanation(model) {
  const r = calculateSeasonScenario(model);
  return `${count(r.attendance - r.paidAttendance)} guests enter free; ${count(r.paidAttendance)} pay for tickets per home match. Expected counts are rounded for display.`;
}

export function scenarioOutcomeMarkup(model, reference) {
  const r = calculateSeasonScenario(model);
  const before = calculateSeasonScenario(reference);
  const delta = r.contribution - before.contribution;
  return `<span class="lab-eyebrow">${model.homeMatches === 1 ? "Per Home Match" : `${model.homeMatches} Home Matches`} · ${safe(model.program)}</span><div class="lab-outcome-line"><div><h2>Money Left After Costs</h2><strong id="scenario-contribution" class="${r.contribution < 0 ? "is-shortfall" : "is-surplus"}">${usd(r.contribution)}</strong></div><span class="lab-delta ${delta < 0 ? "is-shortfall" : "is-surplus"}">${delta < 0 ? "−" : "+"}${usd(Math.abs(delta))}<small>vs starting case</small></span></div><p id="scenario-margin">${r.margin === null ? "No receipts at these settings" : `${r.margin.toFixed(1)}% of receipts`} · before shared club overhead & taxes</p>`;
}
