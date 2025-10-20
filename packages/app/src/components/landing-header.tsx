import { Link } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { LogIn, UserPlus } from "lucide-react";
import { SiteBrand } from "@/components/site-brand";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type LandingHeaderProps = {
  redirect?: string;
};

export function LandingHeader({ redirect }: LandingHeaderProps) {
  return (
    <header className="border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-6 px-4">
        <Link
          to="/"
          className="text-foreground"
          search={{
            redirect,
          }}
        >
          <SiteBrand />
        </Link>
        <nav className="flex items-center gap-2 text-xs sm:text-sm">
          <AuthLoading>
            <span className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Spinner className="size-4 text-muted-foreground" />
            </span>
          </AuthLoading>
          <Unauthenticated>
            <div className="flex items-center gap-2">
              <Button asChild type="button" variant="ghost" size="sm">
                <Link
                  to="/sign-in"
                  search={{
                    redirect,
                  }}
                >
                  <LogIn className="size-4" />
                  Sign in
                </Link>
              </Button>
              <Button asChild type="button" size="sm">
                <Link
                  to="/sign-up"
                  search={{
                    redirect,
                  }}
                >
                  <UserPlus className="size-4" />
                  Sign up
                </Link>
              </Button>
            </div>
          </Unauthenticated>
          <Authenticated>
            <Button asChild type="button" size="sm">
              <Link to="/workspace">Go to workspace</Link>
            </Button>
          </Authenticated>
        </nav>
      </div>
    </header>
  );
}
