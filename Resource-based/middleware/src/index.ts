import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { DatabaseManager } from "./database";
import { ShardingManager } from "./sharding";
import { DatabaseConfig, QueryRequest } from "./types";

const app = new Hono();
const databaseManager = new DatabaseManager();
let shardingManager: ShardingManager;

// Database configuration - in production, these would come from environment variables
const shardConfigs: DatabaseConfig[] = [
  {
    host: process.env.DB1_HOST || "localhost",
    port: parseInt(process.env.DB1_PORT || "3306"),
    user: process.env.DB1_USER || "polling_user",
    password: process.env.DB1_PASSWORD || "polling_password",
    database: process.env.DB1_NAME || "polling_shard_1",
  },
  {
    host: process.env.DB2_HOST || "localhost",
    port: parseInt(process.env.DB2_PORT || "3307"),
    user: process.env.DB2_USER || "polling_user",
    password: process.env.DB2_PASSWORD || "polling_password",
    database: process.env.DB2_NAME || "polling_shard_2",
  },
];

// Initialize sharding manager
shardingManager = new ShardingManager(shardConfigs);

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    message: "Polling System Database Middleware",
    version: "1.0.0",
    status: "healthy",
    shards: shardingManager.getShardCount(),
    timestamp: new Date().toISOString(),
  });
});

// Health check for all database shards
app.get("/health", async (c) => {
  const healthChecks = await Promise.all(
    shardingManager.getAllShards().map(async (shard, index) => {
      const isHealthy = await databaseManager.checkHealth(shard);
      return {
        shardIndex: index,
        host: `${shard.host}:${shard.port}`,
        database: shard.database,
        healthy: isHealthy,
      };
    })
  );

  const allHealthy = healthChecks.every((check) => check.healthy);

  return c.json(
    {
      status: allHealthy ? "healthy" : "degraded",
      shards: healthChecks,
      timestamp: new Date().toISOString(),
    },
    allHealthy ? 200 : 503
  );
});

// Execute query on specific shard (by key)
app.post("/query/:shardKey", async (c) => {
  try {
    const shardKey = c.req.param("shardKey");
    const request = (await c.req.json()) as QueryRequest;

    if (!request.query) {
      return c.json({ error: "Query is required" }, 400);
    }

    const shard = shardingManager.getShardForKey(shardKey);
    const result = await databaseManager.executeQuery(shard, request);

    return c.json(result);
  } catch (error) {
    console.error("Query execution error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Execute query on specific shard (by index)
app.post("/query/shard/:shardIndex", async (c) => {
  try {
    const shardIndex = parseInt(c.req.param("shardIndex"));
    const request = (await c.req.json()) as QueryRequest;

    if (!request.query) {
      return c.json({ error: "Query is required" }, 400);
    }

    if (isNaN(shardIndex)) {
      return c.json({ error: "Invalid shard index" }, 400);
    }

    const shard = shardingManager.getShardByIndex(shardIndex);
    const result = await databaseManager.executeQuery(shard, request);

    return c.json(result);
  } catch (error) {
    console.error("Query execution error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Execute query on all shards (for aggregation)
app.post("/query/all", async (c) => {
  try {
    const request = (await c.req.json()) as QueryRequest;

    if (!request.query) {
      return c.json({ error: "Query is required" }, 400);
    }

    const shards = shardingManager.getAllShards();
    const results = await databaseManager.executeQueryOnAllShards(
      shards,
      request
    );

    return c.json({
      success: true,
      results: results,
      totalShards: results.length,
    });
  } catch (error) {
    console.error("Multi-shard query execution error:", error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Get shard information for a given key
app.get("/shard-info/:key", (c) => {
  try {
    const key = c.req.param("key");
    const shard = shardingManager.getShardForKey(key);

    return c.json({
      key: key,
      shard: {
        host: shard.host,
        port: shard.port,
        database: shard.database,
      },
    });
  } catch (error) {
    console.error("Shard info error:", error);
    return c.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
});

// Business Logic Endpoints (API forwards to these)

// User endpoints
app.post("/users", async (c) => {
  try {
    const body = await c.req.json();

    if (!body.name || !body.email) {
      return c.json({ error: "Name and email are required" }, 400);
    }

    const userId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Determine shard based on alphabetical order of user ID
    const shard = shardingManager.getShardForKey(userId);

    // Create user in the determined shard
    const result = await databaseManager.executeQuery(shard, {
      query: "INSERT INTO users (id, name, email) VALUES (?, ?, ?)",
      params: [userId, body.name, body.email],
    });

    if (!result.success) {
      return c.json({ error: result.error || "Failed to create user" }, 500);
    }

    return c.json(
      {
        id: userId,
        name: body.name,
        email: body.email,
        createdAt: new Date(),
      },
      201
    );
  } catch (error) {
    console.error("User creation error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

app.get("/users/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const shard = shardingManager.getShardForKey(userId);

    const result = await databaseManager.executeQuery(shard, {
      query: "SELECT * FROM users WHERE id = ?",
      params: [userId],
    });

    if (!result.success) {
      return c.json({ error: "Failed to retrieve user" }, 500);
    }

    if (!result.data || result.data.length === 0) {
      return c.json({ error: "User not found" }, 404);
    }

    const user = result.data[0];
    return c.json({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.created_at,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to retrieve user" }, 500);
  }
});

app.get("/users/:userId/polls", async (c) => {
  try {
    const userId = c.req.param("userId");

    // First verify user exists
    const userShard = shardingManager.getShardForKey(userId);
    const userResult = await databaseManager.executeQuery(userShard, {
      query: "SELECT id FROM users WHERE id = ?",
      params: [userId],
    });

    if (
      !userResult.success ||
      !userResult.data ||
      userResult.data.length === 0
    ) {
      return c.json({ error: "User not found" }, 404);
    }

    // Query all shards for polls created by this user
    const shards = shardingManager.getAllShards();
    const pollResults = await databaseManager.executeQueryOnAllShards(shards, {
      query: "SELECT * FROM polls WHERE creator_id = ?",
      params: [userId],
    });

    const allPolls: any[] = [];
    for (const result of pollResults) {
      if (result.success && result.data) {
        allPolls.push(...result.data);
      }
    }

    return c.json(
      allPolls.map((poll) => ({
        id: poll.id,
        creatorId: poll.creator_id,
        question: poll.question,
        options: JSON.parse(poll.options),
        isActive: Boolean(poll.is_active),
        createdAt: poll.created_at,
        closedAt: poll.closed_at,
      }))
    );
  } catch (error) {
    console.error("Get user polls error:", error);
    return c.json({ error: "Failed to retrieve user polls" }, 500);
  }
});

app.get("/users/:userId/votes", async (c) => {
  try {
    const userId = c.req.param("userId");

    // First verify user exists
    const userShard = shardingManager.getShardForKey(userId);
    const userResult = await databaseManager.executeQuery(userShard, {
      query: "SELECT id FROM users WHERE id = ?",
      params: [userId],
    });

    if (
      !userResult.success ||
      !userResult.data ||
      userResult.data.length === 0
    ) {
      return c.json({ error: "User not found" }, 404);
    }

    // Query all shards for votes cast by this user
    const shards = shardingManager.getAllShards();
    const voteResults = await databaseManager.executeQueryOnAllShards(shards, {
      query: "SELECT * FROM votes WHERE user_id = ?",
      params: [userId],
    });

    const allVotes: any[] = [];
    for (const result of voteResults) {
      if (result.success && result.data) {
        allVotes.push(...result.data);
      }
    }

    return c.json(
      allVotes.map((vote) => ({
        id: vote.id,
        pollId: vote.poll_id,
        userId: vote.user_id,
        optionIndex: vote.option_index,
        timestamp: vote.timestamp,
      }))
    );
  } catch (error) {
    console.error("Get user votes error:", error);
    return c.json({ error: "Failed to retrieve user votes" }, 500);
  }
});

// Poll endpoints
app.post("/polls", async (c) => {
  try {
    const body = await c.req.json();

    if (
      !body.creatorId ||
      !body.question ||
      !body.options ||
      body.options.length < 2
    ) {
      return c.json(
        {
          error: "Creator ID, question, and at least 2 options are required",
        },
        400
      );
    }

    // Verify creator exists
    const userShard = shardingManager.getShardForKey(body.creatorId);
    const userResult = await databaseManager.executeQuery(userShard, {
      query: "SELECT id FROM users WHERE id = ?",
      params: [body.creatorId],
    });

    if (
      !userResult.success ||
      !userResult.data ||
      userResult.data.length === 0
    ) {
      return c.json({ error: "Creator not found" }, 404);
    }

    const pollId = `poll_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Determine shard based on alphabetical order of poll ID
    const pollShard = shardingManager.getShardForKey(pollId);

    const result = await databaseManager.executeQuery(pollShard, {
      query:
        "INSERT INTO polls (id, creator_id, question, options) VALUES (?, ?, ?, ?)",
      params: [
        pollId,
        body.creatorId,
        body.question,
        JSON.stringify(body.options),
      ],
    });

    if (!result.success) {
      return c.json({ error: result.error || "Failed to create poll" }, 500);
    }

    return c.json(
      {
        id: pollId,
        creatorId: body.creatorId,
        question: body.question,
        options: body.options,
        isActive: true,
        createdAt: new Date(),
      },
      201
    );
  } catch (error) {
    console.error("Poll creation error:", error);
    return c.json({ error: "Invalid request body" }, 400);
  }
});

app.get("/polls", async (c) => {
  try {
    // Query all shards for polls
    const shards = shardingManager.getAllShards();
    const pollResults = await databaseManager.executeQueryOnAllShards(shards, {
      query: "SELECT * FROM polls ORDER BY created_at DESC",
    });

    const allPolls: any[] = [];
    for (const result of pollResults) {
      if (result.success && result.data) {
        allPolls.push(...result.data);
      }
    }

    // Sort by creation date (most recent first)
    allPolls.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return c.json(
      allPolls.map((poll) => ({
        id: poll.id,
        creatorId: poll.creator_id,
        question: poll.question,
        options: JSON.parse(poll.options),
        isActive: Boolean(poll.is_active),
        createdAt: poll.created_at,
        closedAt: poll.closed_at,
      }))
    );
  } catch (error) {
    console.error("Get polls error:", error);
    return c.json({ error: "Failed to retrieve polls" }, 500);
  }
});

app.get("/polls/:pollId", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const shard = shardingManager.getShardForKey(pollId);

    const result = await databaseManager.executeQuery(shard, {
      query: "SELECT * FROM polls WHERE id = ?",
      params: [pollId],
    });

    if (!result.success) {
      return c.json({ error: "Failed to retrieve poll" }, 500);
    }

    if (!result.data || result.data.length === 0) {
      return c.json({ error: "Poll not found" }, 404);
    }

    const poll = result.data[0];
    return c.json({
      id: poll.id,
      creatorId: poll.creator_id,
      question: poll.question,
      options: JSON.parse(poll.options),
      isActive: Boolean(poll.is_active),
      createdAt: poll.created_at,
      closedAt: poll.closed_at,
    });
  } catch (error) {
    console.error("Get poll error:", error);
    return c.json({ error: "Failed to retrieve poll" }, 500);
  }
});

app.put("/polls/:pollId/close", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const body = await c.req.json();

    if (!body.userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const shard = shardingManager.getShardForKey(pollId);

    // Get the poll first
    const pollResult = await databaseManager.executeQuery(shard, {
      query: "SELECT * FROM polls WHERE id = ?",
      params: [pollId],
    });

    if (
      !pollResult.success ||
      !pollResult.data ||
      pollResult.data.length === 0
    ) {
      return c.json({ error: "Poll not found" }, 404);
    }

    const poll = pollResult.data[0];

    if (!poll.is_active) {
      return c.json({ error: "Poll is already closed" }, 400);
    }

    if (poll.creator_id !== body.userId) {
      return c.json({ error: "Only the poll creator can close the poll" }, 403);
    }

    // Close the poll
    const updateResult = await databaseManager.executeQuery(shard, {
      query:
        "UPDATE polls SET is_active = FALSE, closed_at = NOW() WHERE id = ?",
      params: [pollId],
    });

    if (!updateResult.success) {
      return c.json({ error: "Failed to close poll" }, 500);
    }

    return c.json({
      id: poll.id,
      creatorId: poll.creator_id,
      question: poll.question,
      options: JSON.parse(poll.options),
      isActive: false,
      createdAt: poll.created_at,
      closedAt: new Date(),
    });
  } catch (error) {
    console.error("Close poll error:", error);
    return c.json({ error: "Failed to close poll" }, 500);
  }
});

// Vote endpoints
app.post("/polls/:pollId/votes", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const body = await c.req.json();

    if (!body.userId || body.optionIndex === undefined) {
      return c.json({ error: "User ID and option index are required" }, 400);
    }

    const pollShard = shardingManager.getShardForKey(pollId);

    // Get the poll and verify it exists and is active
    const pollResult = await databaseManager.executeQuery(pollShard, {
      query: "SELECT * FROM polls WHERE id = ?",
      params: [pollId],
    });

    if (
      !pollResult.success ||
      !pollResult.data ||
      pollResult.data.length === 0
    ) {
      return c.json({ error: "Poll not found" }, 404);
    }

    const poll = pollResult.data[0];

    if (!poll.is_active) {
      return c.json({ error: "Poll is closed" }, 400);
    }

    const options = JSON.parse(poll.options);
    if (body.optionIndex < 0 || body.optionIndex >= options.length) {
      return c.json({ error: "Invalid option index" }, 400);
    }

    // Verify user exists
    const userShard = shardingManager.getShardForKey(body.userId);
    const userResult = await databaseManager.executeQuery(userShard, {
      query: "SELECT id FROM users WHERE id = ?",
      params: [body.userId],
    });

    if (
      !userResult.success ||
      !userResult.data ||
      userResult.data.length === 0
    ) {
      return c.json({ error: "User not found" }, 404);
    }

    const voteId = `vote_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Store vote in same shard as poll (for easier aggregation)
    const voteResult = await databaseManager.executeQuery(pollShard, {
      query:
        "INSERT INTO votes (id, poll_id, user_id, option_index) VALUES (?, ?, ?, ?)",
      params: [voteId, pollId, body.userId, body.optionIndex],
    });

    if (!voteResult.success) {
      return c.json({ error: voteResult.error || "Failed to cast vote" }, 500);
    }

    return c.json(
      {
        id: voteId,
        pollId: pollId,
        userId: body.userId,
        optionIndex: body.optionIndex,
        timestamp: new Date(),
      },
      201
    );
  } catch (error) {
    console.error("Cast vote error:", error);
    return c.json({ error: "Failed to cast vote" }, 500);
  }
});

app.get("/polls/:pollId/results", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const shard = shardingManager.getShardForKey(pollId);

    // Get the poll
    const pollResult = await databaseManager.executeQuery(shard, {
      query: "SELECT * FROM polls WHERE id = ?",
      params: [pollId],
    });

    if (
      !pollResult.success ||
      !pollResult.data ||
      pollResult.data.length === 0
    ) {
      return c.json({ error: "Poll not found" }, 404);
    }

    const poll = pollResult.data[0];
    const options = JSON.parse(poll.options);

    // Get votes for this poll
    const voteResult = await databaseManager.executeQuery(shard, {
      query: "SELECT option_index FROM votes WHERE poll_id = ?",
      params: [pollId],
    });

    const votes = voteResult.success && voteResult.data ? voteResult.data : [];
    const voteCounts = new Array(options.length).fill(0);

    votes.forEach((vote: any) => {
      if (vote.option_index >= 0 && vote.option_index < options.length) {
        voteCounts[vote.option_index]++;
      }
    });

    return c.json({
      pollId: poll.id,
      question: poll.question,
      options: options,
      votes: voteCounts,
      totalVotes: votes.length,
      isActive: Boolean(poll.is_active),
    });
  } catch (error) {
    console.error("Get poll results error:", error);
    return c.json({ error: "Failed to retrieve poll results" }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Endpoint not found" }, 404);
});

// Initialize database connections
async function initializeConnections() {
  console.log("🔌 Initializing database connections...");

  for (const shard of shardConfigs) {
    try {
      await databaseManager.initializeConnection(shard);
    } catch (error) {
      console.error(
        `Failed to initialize shard ${shard.host}:${shard.port}`,
        error
      );
      // Continue with other shards even if one fails
    }
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down middleware...");
  await databaseManager.closeAllConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Shutting down middleware...");
  await databaseManager.closeAllConnections();
  process.exit(0);
});

const port = parseInt(process.env.PORT || "3001");

// Start server
async function startServer() {
  await initializeConnections();

  console.log(`🚀 Database Middleware starting on port ${port}`);

  serve({
    fetch: app.fetch,
    port: port,
  });

  console.log(`✅ Middleware is running on http://localhost:${port}`);
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

module.exports = app;
