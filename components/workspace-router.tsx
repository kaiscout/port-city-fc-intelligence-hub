"use client";
import { usePathname } from "next/navigation";
import { useHubData } from "./data-context";
import { ClubWorkspace } from "./club-workspace";
import { OperationsWorkspace } from "./operations-workspace";
import { SettingsWorkspace } from "./settings-workspace";
import { ScenarioWorkspace } from "./scenario-workspace";
import { Card, EmptyState, PageHeader } from "./ui";
export function WorkspaceRouter({ children }: { children: React.ReactNode }) {
  const { privateMode, workspace, workspaceError, refreshWorkspace } = useHubData();
  const path = usePathname();
  if (!privateMode) {
    if (path === "/scenarios") return <ScenarioWorkspace />;
    if (["/operations", "/settings"].includes(path))
      return (
        <>
          <PageHeader
            eyebrow="Public demonstration"
            title="Private Workflows Require A Club Account."
            description="This public experience does not save operational records, imports, accounts or settings."
          />
          <Card className="padded">
            <EmptyState
              title="Read-only Demonstration"
              detail="Inspect the synthetic analytics and scenario sandbox. A configured private organization is required for authenticated operations and administration."
            />
          </Card>
        </>
      );
    return children;
  }
  if (!workspace)
    return (
      <>
        <PageHeader
          eyebrow="Private workspace"
          title={workspaceError ? "Records could not be loaded." : "Loading your organization…"}
          description={
            workspaceError ?? "No demonstration records are substituted while your data loads."
          }
        />
        <button className="button button-secondary" onClick={() => void refreshWorkspace()}>
          Retry loading
        </button>
      </>
    );
  return (
    <>
      {workspaceError && (
        <p role="alert" className="callout">
          {workspaceError} Displayed records may be stale. Refresh before making decisions.
        </p>
      )}
      {path === "/operations" ? (
        <OperationsWorkspace />
      ) : path === "/settings" ? (
        <SettingsWorkspace />
      ) : path === "/scenarios" ? (
        <ScenarioWorkspace />
      ) : (
        <ClubWorkspace path={path} />
      )}
    </>
  );
}
