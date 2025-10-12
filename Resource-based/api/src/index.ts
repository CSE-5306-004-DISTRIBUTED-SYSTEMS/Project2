import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { users } from "./routes/users";
import { polls } from "./routes/polls";

const app = new Hono();

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Distributed Polling System API",
    version: "1.0.0",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// API status endpoint
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Mount route handlers
app.route("/users", users);
app.route("/polls", polls);

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

const port = parseInt(process.env.PORT || "3000");

console.log(`🚀 Distributed Polling System API starting on port ${port}`);

serve({
  fetch: app.fetch,
  port: port,
});

console.log(`✅ Server is running on http://localhost:${port}`);

export default app;
