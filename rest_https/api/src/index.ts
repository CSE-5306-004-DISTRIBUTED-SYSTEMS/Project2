import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { Pool } from "pg";

const app = new Hono();

// Enable CORS for all routes
app.use(
  "*",
  cors({
    origin: ["http://localhost:3002", "http://localhost:3000"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || "database",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "polling_user",
  password: process.env.DB_PASSWORD || "polling_password",
  database: process.env.DB_NAME || "polling_db",
});

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Distributed Polling System API",
    version: "1.0.0",
    status: "healthy",
    instance: process.env.INSTANCE_NAME || "unknown",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", async (c) => {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();

    return c.json({
      status: "healthy",
      instance: process.env.INSTANCE_NAME || "unknown",
      database: "connected",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json(
      {
        status: "unhealthy",
        instance: process.env.INSTANCE_NAME || "unknown",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      503
    );
  }
});

// POST /polls - Create a new poll
app.post("/polls", async (c) => {
  try {
    const body = await c.req.json();

    if (
      !body.question ||
      !body.options ||
      !Array.isArray(body.options) ||
      body.options.length < 2
    ) {
      return c.json(
        { error: "Question and at least 2 options are required" },
        400
      );
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        "INSERT INTO polls (question, options, created_at) VALUES ($1, $2, NOW()) RETURNING *",
        [body.question, JSON.stringify(body.options)]
      );

      const poll = result.rows[0];
      return c.json(
        {
          id: poll.id,
          question: poll.question,
          options: poll.options, // Already parsed by PostgreSQL JSONB
          isActive: poll.is_active,
          createdAt: poll.created_at,
        },
        201
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Create poll error:", error);
    return c.json({ error: "Failed to create poll" }, 500);
  }
});

// GET /polls - List all polls
app.get("/polls", async (c) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        "SELECT * FROM polls ORDER BY created_at DESC"
      );

      const polls = result.rows.map((poll) => ({
        id: poll.id,
        question: poll.question,
        options: poll.options, // Already parsed by PostgreSQL JSONB
        isActive: poll.is_active,
        createdAt: poll.created_at,
        closedAt: poll.closed_at,
      }));

      return c.json(polls);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get polls error:", error);
    return c.json({ error: "Failed to retrieve polls" }, 500);
  }
});

// POST /polls/:id/votes - Cast a vote
app.post("/polls/:id/votes", async (c) => {
  try {
    const pollId = parseInt(c.req.param("id"));
    const body = await c.req.json();

    if (typeof body.optionIndex !== "number" || body.optionIndex < 0) {
      return c.json({ error: "Valid option index is required" }, 400);
    }

    const client = await pool.connect();
    try {
      // Check if poll exists and is active
      const pollResult = await client.query(
        "SELECT * FROM polls WHERE id = $1",
        [pollId]
      );

      if (pollResult.rows.length === 0) {
        return c.json({ error: "Poll not found" }, 404);
      }

      const poll = pollResult.rows[0];
      if (!poll.is_active) {
        return c.json({ error: "Poll is closed" }, 400);
      }

      const options = poll.options; // Already parsed by PostgreSQL JSONB
      if (body.optionIndex >= options.length) {
        return c.json({ error: "Invalid option index" }, 400);
      }

      // Cast the vote
      const voteResult = await client.query(
        "INSERT INTO votes (poll_id, option_index, created_at) VALUES ($1, $2, NOW()) RETURNING *",
        [pollId, body.optionIndex]
      );

      const vote = voteResult.rows[0];
      return c.json(
        {
          id: vote.id,
          pollId: vote.poll_id,
          optionIndex: vote.option_index,
          timestamp: vote.created_at,
        },
        201
      );
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Cast vote error:", error);
    return c.json({ error: "Failed to cast vote" }, 500);
  }
});

// GET /polls/:id/results - Get poll results
app.get("/polls/:id/results", async (c) => {
  try {
    const pollId = parseInt(c.req.param("id"));

    const client = await pool.connect();
    try {
      // Get poll details
      const pollResult = await client.query(
        "SELECT * FROM polls WHERE id = $1",
        [pollId]
      );

      if (pollResult.rows.length === 0) {
        return c.json({ error: "Poll not found" }, 404);
      }

      const poll = pollResult.rows[0];
      const options = poll.options; // Already parsed by PostgreSQL JSONB

      // Get vote counts
      const voteResult = await client.query(
        "SELECT option_index, COUNT(*) as count FROM votes WHERE poll_id = $1 GROUP BY option_index",
        [pollId]
      );

      // Initialize vote counts array
      const voteCounts = new Array(options.length).fill(0);
      let totalVotes = 0;

      voteResult.rows.forEach((row) => {
        voteCounts[row.option_index] = parseInt(row.count);
        totalVotes += parseInt(row.count);
      });

      return c.json({
        pollId: poll.id,
        question: poll.question,
        options: options,
        votes: voteCounts,
        totalVotes: totalVotes,
        isActive: poll.is_active,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Get results error:", error);
    return c.json({ error: "Failed to retrieve results" }, 500);
  }
});

// PUT /polls/:id/close - Close a poll
app.put("/polls/:id/close", async (c) => {
  try {
    const pollId = parseInt(c.req.param("id"));

    const client = await pool.connect();
    try {
      const result = await client.query(
        "UPDATE polls SET is_active = false, closed_at = NOW() WHERE id = $1 AND is_active = true RETURNING *",
        [pollId]
      );

      if (result.rows.length === 0) {
        return c.json({ error: "Poll not found or already closed" }, 404);
      }

      const poll = result.rows[0];
      return c.json({
        id: poll.id,
        question: poll.question,
        options: poll.options, // Already parsed by PostgreSQL JSONB
        isActive: poll.is_active,
        createdAt: poll.created_at,
        closedAt: poll.closed_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Close poll error:", error);
    return c.json({ error: "Failed to close poll" }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not Found" }, 404);
});

const port = parseInt(process.env.PORT || "3000");
const instanceName = process.env.INSTANCE_NAME || "unknown";

console.log(`🚀 Polling API (${instanceName}) starting on port ${port}`);

serve({
  fetch: app.fetch,
  port: port,
});

console.log(
  `✅ Polling API (${instanceName}) is running on http://localhost:${port}`
);
