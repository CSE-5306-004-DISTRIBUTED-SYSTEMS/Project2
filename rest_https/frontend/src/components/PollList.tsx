import React, { useState, useEffect } from "react";
import { pollApi, Poll } from "../api";
import PollCard from "./PollCard";

const PollList: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPolls = async () => {
    try {
      setError("");
      const allPolls = await pollApi.getAll();
      setPolls(allPolls);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const handlePollUpdated = () => {
    loadPolls();
  };

  if (isLoading) {
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
        <div className="text-red-600 text-center">
          <p className="mb-4">{error}</p>
          <button
            onClick={loadPolls}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (polls.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <p className="text-gray-500 mb-4">No polls available yet.</p>
        <p className="text-sm text-gray-400">
          Create the first poll to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">All Polls</h2>
        <button
          onClick={loadPolls}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      {polls.map((poll) => (
        <PollCard key={poll.id} poll={poll} onPollUpdated={handlePollUpdated} />
      ))}
    </div>
  );
};

export default PollList;
