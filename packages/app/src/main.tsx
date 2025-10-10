import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const elem = document.getElementById("root");

if (!elem) {
  throw new Error("Root element not found");
}

createRoot(elem).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
