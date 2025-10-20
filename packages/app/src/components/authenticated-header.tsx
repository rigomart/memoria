import { UserButton } from "@clerk/clerk-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Authenticated, AuthLoading } from "convex/react";
import { SiteBrand } from "@/components/site-brand";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export function AuthenticatedHeader() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link to="/workspace" className="text-foreground">
            <SiteBrand hideTextOnMobile />
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className={cn(pathname === "/workspace" ? "font-semibold" : "text-foreground")}
              to="/workspace"
            >
              Workspace
            </Link>

            <Link
              className={cn(pathname === "/settings" ? "font-semibold" : "text-foreground")}
              to="/settings"
            >
              Settings
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <AuthLoading>
            <span className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Spinner className="size-4 text-muted-foreground" />
            </span>
          </AuthLoading>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
