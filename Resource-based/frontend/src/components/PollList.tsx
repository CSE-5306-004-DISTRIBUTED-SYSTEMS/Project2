import React, { useState, useEffect } from "react";
import { pollApi } from "../api";
import { Poll, User } from "../types";
import PollCard from "./PollCard";

interface PollListProps {
  user: User;
  refreshTrigger: number;
}

const PollList: React.FC<PollListProps> = ({ user, refreshTrigger }) => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const pollsData = await pollApi.getAll();
      setPolls(pollsData);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to fetch polls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, [refreshTrigger]);

  const handleVoteCast = () => {
    // Refresh polls after a vote is cast
    fetchPolls();
  };

  const handlePollClosed = () => {
    // Refresh polls after a poll is closed
    fetchPolls();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
        <button
          onClick={fetchPolls}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">All Polls</h2>

      {polls.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">
          No polls available. Create the first one!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {polls.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              user={user}
              onVoteCast={handleVoteCast}
              onPollClosed={handlePollClosed}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PollList;
