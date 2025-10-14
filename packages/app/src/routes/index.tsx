import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search.redirect as string | undefined) ?? undefined,
    };
  },
});

function HomeRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = Route.useNavigate();
  const { redirect } = Route.useSearch();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to the original destination if provided, otherwise go to projects
      const destination = redirect ?? "/projects";
      navigate({ to: destination, search: { redirect: undefined } });
    }
  }, [isAuthenticated, isLoading, navigate, redirect]);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-dashed px-4 py-12 text-center text-sm text-muted-foreground">
        Preparing your workspace…
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Welcome to Memoria</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to create projects, manage documents, and capture knowledge with Markdown and
        frontmatter validation.
      </p>
      <SignInButton mode="modal">
        <Button type="button">Sign in</Button>
      </SignInButton>
    </div>
  );
}
