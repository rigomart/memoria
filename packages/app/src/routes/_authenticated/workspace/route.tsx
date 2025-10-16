import { createFileRoute, Outlet } from "@tanstack/react-router";
import { WorkspaceHeader } from "./-components/workspace-header";

export const Route = createFileRoute("/_authenticated/workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <WorkspaceHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
