import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { useConvexAuth } from "convex/react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const navigate = Route.useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate({ to: "/projects" });
    }
  }, [isAuthenticated, isLoading, navigate]);

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
