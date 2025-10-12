import axios from "axios";
import {
  User,
  Poll,
  Vote,
  PollResults,
  CreateUserRequest,
  CreatePollRequest,
  CastVoteRequest,
} from "./types";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// User API calls
export const userApi = {
  create: async (userData: CreateUserRequest): Promise<User> => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  getById: async (userId: string): Promise<User> => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  getPolls: async (userId: string): Promise<Poll[]> => {
    const response = await api.get(`/users/${userId}/polls`);
    return response.data;
  },

  getVotes: async (userId: string): Promise<Vote[]> => {
    const response = await api.get(`/users/${userId}/votes`);
    return response.data;
  },
};

// Poll API calls
export const pollApi = {
  create: async (pollData: CreatePollRequest): Promise<Poll> => {
    const response = await api.post("/polls", pollData);
    return response.data;
  },

  getAll: async (): Promise<Poll[]> => {
    const response = await api.get("/polls");
    return response.data;
  },

  getById: async (pollId: string): Promise<Poll> => {
    const response = await api.get(`/polls/${pollId}`);
    return response.data;
  },

  close: async (pollId: string, userId: string): Promise<Poll> => {
    const response = await api.put(`/polls/${pollId}/close`, { userId });
    return response.data;
  },

  vote: async (pollId: string, voteData: CastVoteRequest): Promise<Vote> => {
    const response = await api.post(`/polls/${pollId}/votes`, voteData);
    return response.data;
  },

  getResults: async (pollId: string): Promise<PollResults> => {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{
    status: string;
    uptime: number;
    timestamp: string;
  }> => {
    const response = await api.get("/health");
    return response.data;
  },
};
