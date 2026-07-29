#!/usr/bin/env node
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createTaskgameServer } from "./server.js";

const PORT = Number(process.env.MCP_HTTP_PORT || 3013);

const transports = new Map<string, StreamableHTTPServerTransport>();

const httpServer = createServer(async (req, res) => {
  if (!req.url || !req.url.startsWith("/mcp")) {
    res.writeHead(404).end("Not found");
    return;
  }

  const sessionHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  const existing = sessionId ? transports.get(sessionId) : undefined;

  if (existing) {
    await existing.handleRequest(req, res);
    return;
  }

  if (sessionId) {
    res.writeHead(404).end(JSON.stringify({ error: "unknown session" }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(400).end(JSON.stringify({ error: "missing mcp-session-id" }));
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sid) => {
      transports.set(sid, transport);
    },
  });
  transport.onclose = () => {
    const sid = transport.sessionId;
    if (sid) transports.delete(sid);
  };

  const server = await createTaskgameServer();
  await server.connect(transport);
  await transport.handleRequest(req, res);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`taskgame MCP HTTP server listening on http://0.0.0.0:${PORT}/mcp`);
});
