import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { ConvexReactClient, useConvexAuth } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Add your Convex deployment URL to the .env file as VITE_CONVEX_URL");
}

const convex = new ConvexReactClient(CONVEX_URL);

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function InnerApp() {
  const auth = useConvexAuth();
  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      <Toaster />
    </>
  );
}

// Render the app
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element");
}

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <InnerApp />
          </ThemeProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </StrictMode>,
  );
}
