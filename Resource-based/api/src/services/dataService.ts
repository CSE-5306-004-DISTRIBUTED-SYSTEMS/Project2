import axios from "axios";
import {
  User,
  Poll,
  Vote,
  CreateUserRequest,
  CreatePollRequest,
  CastVoteRequest,
  PollResults,
} from "../types";

const MIDDLEWARE_URL = process.env.MIDDLEWARE_URL || "http://localhost:3001";

export class DataService {
  private middlewareUrl: string;

  constructor(middlewareUrl: string = MIDDLEWARE_URL) {
    this.middlewareUrl = middlewareUrl;
  }

  // User operations
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${this.middlewareUrl}/users`, userData);
    return response.data;
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const response = await axios.get(`${this.middlewareUrl}/users/${userId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getUserPolls(userId: string): Promise<Poll[]> {
    const response = await axios.get(
      `${this.middlewareUrl}/users/${userId}/polls`
    );
    return response.data;
  }

  async getUserVotes(userId: string): Promise<Vote[]> {
    const response = await axios.get(
      `${this.middlewareUrl}/users/${userId}/votes`
    );
    return response.data;
  }

  // Poll operations
  async createPoll(pollData: CreatePollRequest): Promise<Poll> {
    const response = await axios.post(`${this.middlewareUrl}/polls`, pollData);
    return response.data;
  }

  async getAllPolls(): Promise<Poll[]> {
    const response = await axios.get(`${this.middlewareUrl}/polls`);
    return response.data;
  }

  async getPoll(pollId: string): Promise<Poll | null> {
    try {
      const response = await axios.get(`${this.middlewareUrl}/polls/${pollId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async closePoll(pollId: string, userId: string): Promise<Poll> {
    const response = await axios.put(
      `${this.middlewareUrl}/polls/${pollId}/close`,
      { userId }
    );
    return response.data;
  }

  // Vote operations
  async castVote(pollId: string, voteData: CastVoteRequest): Promise<Vote> {
    const response = await axios.post(
      `${this.middlewareUrl}/polls/${pollId}/votes`,
      voteData
    );
    return response.data;
  }

  async getPollResults(pollId: string): Promise<PollResults> {
    const response = await axios.get(
      `${this.middlewareUrl}/polls/${pollId}/results`
    );
    return response.data;
  }

  // Health check
  async checkHealth(): Promise<any> {
    const response = await axios.get(`${this.middlewareUrl}/health`);
    return response.data;
  }
}

export const dataService = new DataService();
