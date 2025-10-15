import { UserButton } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import { Authenticated } from "convex/react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function WorkspaceHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="flex h-12 items-center justify-between gap-6 px-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/workspace" className="flex items-center gap-2 text-foreground">
                  <span className="flex size-8 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/40">
                    M
                  </span>

                  <div className="text-sm font-semibold uppercase tracking-wider">Memoria</div>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/workspace">Workspace</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
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
