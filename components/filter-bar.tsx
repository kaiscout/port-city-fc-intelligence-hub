"use client";

import { Filter, RotateCcw } from "lucide-react";
import { useHubData } from "./data-context";

export function FilterBar() {
  const { filters, setFilters, fixtures } = useHubData();
  const update = (key: keyof typeof filters, value: string) =>
    setFilters((current) => ({ ...current, [key]: value }));

  return (
    <section className="filter-bar" aria-label="Global dashboard filters">
      <div className="filter-title">
        <Filter size={16} aria-hidden="true" />
        <span>Scope</span>
      </div>
      <label>
        <span>Season</span>
        <select value={filters.season} onChange={(event) => update("season", event.target.value)}>
          <option>2026</option>
          <option>2025</option>
        </select>
      </label>
      <label>
        <span>Team</span>
        <select value={filters.team} onChange={(event) => update("team", event.target.value)}>
          <option>All</option>
          <option>Men</option>
          <option>Women</option>
        </select>
      </label>
      <label>
        <span>Competition</span>
        <select
          value={filters.competition}
          onChange={(event) => update("competition", event.target.value)}
        >
          <option>All competitions</option>
          <option>USL League Two</option>
          <option>USL W League</option>
        </select>
      </label>
      <label>
        <span>Venue</span>
        <select value={filters.venue} onChange={(event) => update("venue", event.target.value)}>
          <option>All venues</option>
          <option>Legion Stadium</option>
          <option>UNCW Soccer Stadium</option>
        </select>
      </label>
      <label className="fixture-filter">
        <span>Fixture</span>
        <select value={filters.fixture} onChange={(event) => update("fixture", event.target.value)}>
          <option>All fixtures</option>
          {fixtures.map((fixture) => (
            <option key={fixture.id} value={fixture.id}>
              {fixture.id} · {fixture.opponent}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button button-ghost filter-reset"
        onClick={() =>
          setFilters((current) => ({
            ...current,
            team: "All",
            competition: "All competitions",
            venue: "All venues",
            fixture: "All fixtures",
          }))
        }
      >
        <RotateCcw size={15} /> Reset
      </button>
    </section>
  );
}
