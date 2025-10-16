import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceHeader } from "./-components/workspace-header";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <div>
      <WorkspaceHeader />
      <Outlet />
    </div>
  );
}
