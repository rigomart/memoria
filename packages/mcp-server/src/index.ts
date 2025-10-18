#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MemoriaClient } from "./client";
import { loadConfig } from "./config";
import { createLogger } from "./logger";
import { registerTools } from "./tools";

async function main() {
  const config = loadConfig(process.env);
  const logger = createLogger(config.debug);

  logger.info("Starting Memoria MCP server…");

  const client = new MemoriaClient(config, logger);
  await client.verifyConnection();

  const server = new McpServer({
    name: "memoria-mcp",
    version: "0.1.0",
  });

  registerTools(server, client, logger);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("Memoria MCP server connected. Waiting for requests…");

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info(`Received ${signal}, shutting down…`);
    await server.close().catch((error) => {
      logger.error("Error while closing server:", error);
    });
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  process.on("uncaughtException", (error) => {
    logger.error("Uncaught exception:", error);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason) => {
    logger.error("Unhandled promise rejection:", reason);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error("[memoria-mcp]", error instanceof Error ? error.message : error);
  process.exit(1);
});
