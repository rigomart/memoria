import { createFileRoute, Outlet, redirect, useChildMatches } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
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
  const matches = useChildMatches();

  const routeBreadcrumbContexts = matches.map((match) => match.context.breadcrumb);
  // returns either [{label: "Project", path: "/workspace/$projectHandle"}] or [{label: "Document", path: "/workspace/$projectHandle/$docId"}]

  // transform [{label: "Document", path: "/workspace/$projectHandle/$docId"}] into ["/workspace", "/workspace/$projectHandle", "/workspace/$projectHandle/$docId"]
  const breadcrumbs = routeBreadcrumbContexts.flatMap((breadcrumb) => {
    if (!breadcrumb) return [];

    const pathSegments = breadcrumb.path.split("/").filter(Boolean);
    const breadcrumbPaths: string[] = [];

    // Build cumulative paths
    for (let i = 0; i < pathSegments.length; i++) {
      const currentPath = `/${pathSegments.slice(0, i + 1).join("/")}`;
      breadcrumbPaths.push(currentPath);
    }

    return breadcrumbPaths.map((path, index) => ({
      label: index === pathSegments.length - 1 ? breadcrumb.label : getPathLabel(path),
      path,
    }));
  });

  function getPathLabel(path: string): string {
    if (path === "/workspace") return "Workspace";
    // For dynamic segments, we'd need more context, but for now return generic labels
    if (path.startsWith("/workspace/") && path.split("/").length === 3) return "Project";
    return "Document";
  }

  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb) => (
            <BreadcrumbItem key={breadcrumb.path}>
              <BreadcrumbLink href={breadcrumb.path}>{breadcrumb.label}</BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      {JSON.stringify(breadcrumbs)}
      <WorkspaceHeader />
      <Outlet />
    </div>
  );
}
