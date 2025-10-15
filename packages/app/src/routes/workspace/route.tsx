import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { WorkspaceHeader } from "./-components/workspace-header";

export const Route = createFileRoute("/workspace")({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: "/",
        search: { redirect: location.href },
      });
    }
  },
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
