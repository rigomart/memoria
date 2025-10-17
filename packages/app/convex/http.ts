import { httpRouter } from "convex/server";
import { mcpGetDocument, mcpSearch } from "./handlers/mcp";

const http = httpRouter();

// MCP Search Endpoint
http.route({
  path: "/mcp/search",
  method: "POST",
  handler: mcpSearch,
});

// MCP Get Document Endpoint
http.route({
  path: "/mcp/get_document",
  method: "POST",
  handler: mcpGetDocument,
});

export default http;
