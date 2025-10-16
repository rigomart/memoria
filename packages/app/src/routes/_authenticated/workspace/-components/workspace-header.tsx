import { UserButton } from "@clerk/clerk-react";
import { Link, useParams } from "@tanstack/react-router";
import { Authenticated, useQuery } from "convex/react";
import { Brain } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { api } from "@/convex/_generated/api";

export function WorkspaceHeader() {
  const workspaceTree = useQuery(api.workspace.getWorkspaceTree);
  const { projectHandle, docId } = useParams({ strict: false });

  // Find project and document data from workspace tree
  const currentProject = projectHandle
    ? workspaceTree?.find((entry) => entry.project.handle === projectHandle)
    : undefined;

  const currentDocument =
    docId && currentProject ? currentProject.documents.find((doc) => doc._id === docId) : undefined;

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  to="/workspace"
                  className="flex items-center rounded-full bg-primary p-1 text-background"
                >
                  <Brain className="size-6" />
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/workspace">Workspace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {currentProject && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link
                      to="/workspace/$projectHandle"
                      params={{ projectHandle: currentProject.project.handle }}
                    >
                      {currentProject.project.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}

            {currentDocument && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className="text-sm font-semibold">
                      {currentDocument.title || "Untitled Document"}
                    </span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3">
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
