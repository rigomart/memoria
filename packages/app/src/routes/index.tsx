import { SignInButton } from "@clerk/clerk-react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: HomeRoute,
});

function HomeRoute() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border px-6 py-8">
      <h1 className="text-2xl font-semibold text-foreground">Welcome to Memoria</h1>
      <p className="text-sm text-muted-foreground">
        Sign in to create projects, manage documents, and capture knowledge with Markdown and
        metadata management.
      </p>
      <SignInButton mode="modal">
        <Button type="button">Sign in</Button>
      </SignInButton>
    </div>
  );
}
