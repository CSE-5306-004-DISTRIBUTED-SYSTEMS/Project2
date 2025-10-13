import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Poll {
  id: number;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: string;
  closedAt?: string;
}

export interface Vote {
  id: number;
  pollId: number;
  optionIndex: number;
  timestamp: string;
}

export interface PollResults {
  pollId: number;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  isActive: boolean;
}

// Poll API calls
export const pollApi = {
  create: async (question: string, options: string[]): Promise<Poll> => {
    const response = await api.post("/polls", { question, options });
    return response.data;
  },

  getAll: async (): Promise<Poll[]> => {
    const response = await api.get("/polls");
    return response.data;
  },

  close: async (pollId: number): Promise<Poll> => {
    const response = await api.put(`/polls/${pollId}/close`);
    return response.data;
  },

  vote: async (pollId: number, optionIndex: number): Promise<Vote> => {
    const response = await api.post(`/polls/${pollId}/votes`, { optionIndex });
    return response.data;
  },

  getResults: async (pollId: number): Promise<PollResults> => {
    const response = await api.get(`/polls/${pollId}/results`);
    return response.data;
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<{
    status: string;
    instance: string;
    database: string;
    timestamp: string;
  }> => {
    const response = await api.get("/health");
    return response.data;
  },
};
