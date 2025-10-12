import { Hono } from "hono";
import { dataService } from "../services/dataService";

const users = new Hono();

// POST /users - Create a user
users.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const user = await dataService.createUser(body);
    return c.json(user, 201);
  } catch (error: any) {
    console.error("User creation error:", error);
    if (error.response?.status === 400) {
      return c.json({ error: error.response.data.error }, 400);
    }
    return c.json({ error: "Failed to create user" }, 500);
  }
});

// GET /users/{userId} - Get user details
users.get("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const user = await dataService.getUser(userId);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error: any) {
    console.error("Get user error:", error);
    return c.json({ error: "Failed to retrieve user" }, 500);
  }
});

// GET /users/{userId}/polls - List polls created by this user
users.get("/:userId/polls", async (c) => {
  try {
    const userId = c.req.param("userId");
    const polls = await dataService.getUserPolls(userId);
    return c.json(polls);
  } catch (error: any) {
    console.error("Get user polls error:", error);
    if (error.response?.status === 404) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ error: "Failed to retrieve user polls" }, 500);
  }
});

// GET /users/{userId}/votes - List votes cast by this user
users.get("/:userId/votes", async (c) => {
  try {
    const userId = c.req.param("userId");
    const votes = await dataService.getUserVotes(userId);
    return c.json(votes);
  } catch (error: any) {
    console.error("Get user votes error:", error);
    if (error.response?.status === 404) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({ error: "Failed to retrieve user votes" }, 500);
  }
});

export { users };
