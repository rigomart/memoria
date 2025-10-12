import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import App from "./App.tsx";

const elem = document.getElementById("root");

if (!elem) {
  throw new Error("Root element not found");
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(elem).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
