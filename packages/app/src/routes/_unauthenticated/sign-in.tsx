import { SignIn } from "@clerk/clerk-react";
import { shadcn } from "@clerk/themes";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_unauthenticated/sign-in")({
  component: SignInRoute,
});

function SignInRoute() {
  const { redirect } = Route.useSearch();
  const target = redirect ?? "/workspace";

  return (
    <SignIn
      forceRedirectUrl={target}
      fallbackRedirectUrl={target}
      signUpUrl={redirect ? `/sign-up?redirect=${encodeURIComponent(redirect)}` : "/sign-up"}
      appearance={{ baseTheme: shadcn }}
    />
  );
}
