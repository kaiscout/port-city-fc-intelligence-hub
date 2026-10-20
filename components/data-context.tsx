"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoFixtures, scenarioPresets } from "@/lib/data/demo";
import type { Fixture, ScenarioInput } from "@/lib/types";
import type { WorkspaceSnapshot } from "@/lib/workspace";

type Filters = {
  season: string;
  team: "All" | "Men" | "Women";
  competition: string;
  venue: string;
  fixture: string;
};

type HubData = {
  privateMode: boolean;
  workspace: WorkspaceSnapshot | null;
  workspaceError: string | null;
  refreshWorkspace: () => Promise<void>;
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  fixtures: Fixture[];
  filteredFixtures: Fixture[];
  scenarios: ScenarioInput[];
  scenarioAudit: {
    id: string;
    action: string;
    summary: string;
    entityId: string | null;
    createdAt: string;
  }[];
  scenariosReady: boolean;
  scenariosReadOnly: boolean;
  scenarioError: string | null;
  reloadScenarios: () => Promise<void>;
  saveScenario: (scenario: ScenarioInput) => Promise<void>;
  duplicateScenario: (id: string) => Promise<void>;
  deleteScenario: (id: string) => Promise<void>;
  resetDemo: () => Promise<void>;
};

const defaultFilters: Filters = {
  season: "2026",
  team: "All",
  competition: "All competitions",
  venue: "All venues",
  fixture: "All fixtures",
};

const HubDataContext = createContext<HubData | null>(null);

export function HubDataProvider({
  children,
  privateMode = false,
}: {
  children: React.ReactNode;
  privateMode?: boolean;
}) {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const refreshWorkspace = useCallback(async () => {
    if (!privateMode) return;
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Unable to load private records");
      setWorkspace(body);
      setWorkspaceError(null);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load private records");
    }
  }, [privateMode]);
  const [filters, setFilters] = useState(defaultFilters);
  const [scenarios, setScenarios] = useState<ScenarioInput[]>(privateMode ? [] : scenarioPresets);
  const [scenarioAudit, setScenarioAudit] = useState<HubData["scenarioAudit"]>([]);
  const [scenariosReady, setScenariosReady] = useState(false);
  const [scenariosReadOnly, setScenariosReadOnly] = useState(true);
  const [scenarioError, setScenarioError] = useState<string | null>(null);

  const loadScenarios = useCallback(async () => {
    try {
      const [response, auditResponse] = await Promise.all([
        fetch("/api/scenarios", { cache: "no-store" }),
        fetch("/api/scenarios/audit", { cache: "no-store" }),
      ]);
      const body = (await response.json()) as {
        data?: ScenarioInput[];
        readOnly?: boolean;
        error?: string;
      };
      if (!response.ok || !body.data) throw new Error(body.error ?? "Unable to load scenarios");
      setScenarios(body.data);
      setScenariosReadOnly(Boolean(body.readOnly));
      if (auditResponse.ok) {
        const auditBody = (await auditResponse.json()) as { data?: HubData["scenarioAudit"] };
        setScenarioAudit(auditBody.data ?? []);
      }
      setScenarioError(null);
    } catch (error) {
      setScenarioError(error instanceof Error ? error.message : "Unable to load scenarios");
      setScenariosReadOnly(true);
    } finally {
      setScenariosReady(true);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadScenarios();
      void refreshWorkspace();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadScenarios, refreshWorkspace]);

  const mutate = async (url: string, init: RequestInit) => {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init.headers },
    });
    const body = (await response.json()) as { data?: ScenarioInput; error?: string };
    if (!response.ok) throw new Error(body.error ?? "Scenario change failed");
    return body.data;
  };

  const filteredFixtures = useMemo(
    () =>
      (privateMode ? [] : demoFixtures).filter(
        (fixture) =>
          (filters.season === "All seasons" || fixture.date.startsWith(filters.season)) &&
          (filters.team === "All" || fixture.program === filters.team) &&
          (filters.competition === "All competitions" ||
            fixture.competition === filters.competition) &&
          (filters.venue === "All venues" || fixture.venue === filters.venue) &&
          (filters.fixture === "All fixtures" || fixture.id === filters.fixture),
      ),
    [filters, privateMode],
  );

  const value: HubData = {
    privateMode,
    workspace,
    workspaceError,
    refreshWorkspace,
    filters,
    setFilters,
    fixtures: privateMode ? [] : demoFixtures,
    filteredFixtures,
    scenarios,
    scenarioAudit,
    scenariosReady,
    scenariosReadOnly,
    scenarioError,
    reloadScenarios: loadScenarios,
    saveScenario: async (scenario) => {
      const saved = await mutate("/api/scenarios", {
        method: "POST",
        body: JSON.stringify(scenario),
      });
      if (saved) await loadScenarios();
    },
    duplicateScenario: async (id) => {
      const source = scenarios.find((item) => item.id === id);
      if (!source) return;
      const saved = await mutate("/api/scenarios", {
        method: "POST",
        body: JSON.stringify({
          ...source,
          id: `new-${Date.now()}`,
          name: `${source.name} — copy`,
          version: undefined,
        }),
      });
      if (saved) await loadScenarios();
    },
    deleteScenario: async (id) => {
      await mutate(`/api/scenarios/${encodeURIComponent(id)}`, {
        method: "DELETE",
        body: JSON.stringify({ version: scenarios.find((s) => s.id === id)?.version }),
      });
      await loadScenarios();
    },
    resetDemo: async () => {
      setFilters(defaultFilters);
      await loadScenarios();
    },
  };

  return <HubDataContext.Provider value={value}>{children}</HubDataContext.Provider>;
}

export function useHubData() {
  const value = useContext(HubDataContext);
  if (!value) throw new Error("useHubData must be used inside HubDataProvider");
  return value;
}
