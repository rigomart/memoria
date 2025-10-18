import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "convex/react";
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
  const { docHandle } = useParams({ strict: false });

  const suffix = docHandle ? extractSuffix(docHandle) : null;
  const currentDocument = useQuery(api.documents.getDocumentBySuffix, suffix ? { suffix } : "skip");

  return (
    <header className="sticky top-16 z-20 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
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
                <Link to="/workspace">Documents</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {currentDocument && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>
                    <span className="text-sm font-semibold">{currentDocument.title}</span>
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-3" />
      </div>
    </header>
  );
}

function extractSuffix(handle: string | undefined): string | null {
  if (!handle) {
    return null;
  }
  const lastDashIndex = handle.lastIndexOf("-");
  if (lastDashIndex === -1 || lastDashIndex === handle.length - 1) {
    return null;
  }
  return handle.slice(lastDashIndex + 1);
}
