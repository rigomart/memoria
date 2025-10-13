import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-gradient-to-b from-background/95 via-background/90 to-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-6 px-4">
        <Link to="/projects" className="flex items-center gap-3 text-foreground">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-sm shadow-primary/40">
            M
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold uppercase tracking-wider">Memoria</span>
            <span className="text-xs text-muted-foreground">Knowledge workspace</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <AuthLoading>
            <span className="flex size-9 items-center justify-center rounded-full border border-border/60 bg-muted/30">
              <Spinner className="size-4 text-muted-foreground" />
            </span>
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button type="button" variant="outline" size="sm">
                Sign in
              </Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <UserButton />
          </Authenticated>
        </div>
      </div>
    </header>
  );
}
