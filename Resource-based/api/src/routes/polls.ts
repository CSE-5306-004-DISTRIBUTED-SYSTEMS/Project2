import { Hono } from "hono";
import { dataService } from "../services/dataService";

const polls = new Hono();

// POST /polls - Create a new poll
polls.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const poll = await dataService.createPoll(body);
    return c.json(poll, 201);
  } catch (error: any) {
    console.error("Poll creation error:", error);
    if (error.response?.status === 400) {
      return c.json({ error: error.response.data.error }, 400);
    }
    if (error.response?.status === 404) {
      return c.json({ error: error.response.data.error }, 404);
    }
    return c.json({ error: "Failed to create poll" }, 500);
  }
});

// GET /polls - List all polls
polls.get("/", async (c) => {
  try {
    const polls = await dataService.getAllPolls();
    return c.json(polls);
  } catch (error: any) {
    console.error("Get polls error:", error);
    return c.json({ error: "Failed to retrieve polls" }, 500);
  }
});

// GET /polls/{pollId} - Get details for a specific poll
polls.get("/:pollId", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const poll = await dataService.getPoll(pollId);

    if (!poll) {
      return c.json({ error: "Poll not found" }, 404);
    }

    return c.json(poll);
  } catch (error: any) {
    console.error("Get poll error:", error);
    return c.json({ error: "Failed to retrieve poll" }, 500);
  }
});

// PUT /polls/{pollId}/close - Close a poll (creator only)
polls.put("/:pollId/close", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const body = await c.req.json();

    if (!body.userId) {
      return c.json({ error: "User ID is required" }, 400);
    }

    const poll = await dataService.closePoll(pollId, body.userId);
    return c.json(poll);
  } catch (error: any) {
    console.error("Close poll error:", error);
    if (error.response?.status === 400) {
      return c.json({ error: error.response.data.error }, 400);
    }
    if (error.response?.status === 403) {
      return c.json({ error: error.response.data.error }, 403);
    }
    if (error.response?.status === 404) {
      return c.json({ error: error.response.data.error }, 404);
    }
    return c.json({ error: "Failed to close poll" }, 500);
  }
});

// POST /polls/{pollId}/votes - Cast a vote on a poll
polls.post("/:pollId/votes", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const body = await c.req.json();

    const vote = await dataService.castVote(pollId, body);
    return c.json(vote, 201);
  } catch (error: any) {
    console.error("Cast vote error:", error);
    if (error.response?.status === 400) {
      return c.json({ error: error.response.data.error }, 400);
    }
    if (error.response?.status === 404) {
      return c.json({ error: error.response.data.error }, 404);
    }
    return c.json({ error: "Failed to cast vote" }, 500);
  }
});

// GET /polls/{pollId}/results - Get current results for a poll
polls.get("/:pollId/results", async (c) => {
  try {
    const pollId = c.req.param("pollId");
    const results = await dataService.getPollResults(pollId);
    return c.json(results);
  } catch (error: any) {
    console.error("Get poll results error:", error);
    if (error.response?.status === 404) {
      return c.json({ error: error.response.data.error }, 404);
    }
    return c.json({ error: "Failed to retrieve poll results" }, 500);
  }
});

export { polls };
