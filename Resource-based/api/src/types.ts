export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface Poll {
  id: string;
  creatorId: string;
  question: string;
  options: string[];
  isActive: boolean;
  createdAt: Date;
  closedAt?: Date;
}

export interface Vote {
  id: string;
  pollId: string;
  userId: string;
  optionIndex: number;
  timestamp: Date;
}

export interface PollResults {
  pollId: string;
  question: string;
  options: string[];
  votes: number[];
  totalVotes: number;
  isActive: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface CreatePollRequest {
  creatorId: string;
  question: string;
  options: string[];
}

export interface CastVoteRequest {
  userId: string;
  optionIndex: number;
}
