import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Link } from "@tanstack/react-router";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
        <Link to="/projects" className="text-lg font-semibold text-foreground">
          Memoria
        </Link>
        <div className="flex items-center gap-2">
          <AuthLoading>
            <div className="size-9 rounded-full border border-border/80 bg-muted/40" aria-hidden />
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-md border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Sign in
              </button>
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
