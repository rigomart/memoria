import { SignUp } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_unauthenticated/sign-up")({
  component: SignUpRoute,
});

function SignUpRoute() {
  const { redirect } = Route.useSearch();
  const target = redirect ?? "/workspace";

  return (
    <SignUp
      forceRedirectUrl={target}
      fallbackRedirectUrl={target}
      signInUrl={redirect ? `/sign-in?redirect=${encodeURIComponent(redirect)}` : "/sign-in"}
      appearance={{
        baseTheme: shadcn,
      }}
    />
  );
}
