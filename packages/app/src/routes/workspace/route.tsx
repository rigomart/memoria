import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

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
  pendingComponent: WorkspacePending,
});

function WorkspacePending() {
  return (
    <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
      Preparing your workspace… asdasdsa
    </div>
  );
}

function WorkspaceLayout() {
  return <Outlet />;
}
