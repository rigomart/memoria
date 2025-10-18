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
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export function WorkspaceHeader() {
  const { docId } = useParams({ strict: false });
  const currentDocument = useQuery(
    api.documents.getDocument,
    docId ? { documentId: docId as Id<"documents"> } : "skip",
  );

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

        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/settings">Settings</Link>
          </Button>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
