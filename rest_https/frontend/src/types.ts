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
