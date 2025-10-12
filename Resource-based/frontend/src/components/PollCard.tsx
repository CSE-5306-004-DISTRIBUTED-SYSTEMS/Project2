import React, { useState, useEffect } from "react";
import { pollApi } from "../api";
import { Poll, User, PollResults } from "../types";

interface PollCardProps {
  poll: Poll;
  user: User;
  onVoteCast: () => void;
  onPollClosed: () => void;
}

const PollCard: React.FC<PollCardProps> = ({
  poll,
  user,
  onVoteCast,
  onPollClosed,
}) => {
  const [results, setResults] = useState<PollResults | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = async () => {
    try {
      const resultsData = await pollApi.getResults(poll.id);
      setResults(resultsData);
    } catch (err: any) {
      console.error("Failed to fetch results:", err);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [poll.id]);

  const handleVote = async () => {
    if (selectedOption === null) return;

    setVoting(true);
    setError("");

    try {
      await pollApi.vote(poll.id, {
        userId: user.id,
        optionIndex: selectedOption,
      });
      await fetchResults();
      onVoteCast();
      setSelectedOption(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cast vote");
    } finally {
      setVoting(false);
    }
  };

  const handleClosePoll = async () => {
    setClosing(true);
    setError("");

    try {
      await pollApi.close(poll.id, user.id);
      await fetchResults();
      onPollClosed();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to close poll");
    } finally {
      setClosing(false);
    }
  };

  const isCreator = poll.creatorId === user.id;
  const maxVotes = results ? Math.max(...results.votes, 1) : 1;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          {poll.question}
        </h3>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Total votes: {results?.totalVotes || 0}</span>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              poll.isActive
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {poll.isActive ? "Active" : "Closed"}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {poll.options.map((option, index) => {
          const voteCount = results?.votes[index] || 0;
          const percentage = results?.totalVotes
            ? (voteCount / results.totalVotes) * 100
            : 0;
          const barWidth = results?.totalVotes
            ? (voteCount / maxVotes) * 100
            : 0;

          return (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center cursor-pointer">
                  {poll.isActive && (
                    <input
                      type="radio"
                      name={`poll-${poll.id}`}
                      value={index}
                      checked={selectedOption === index}
                      onChange={() => setSelectedOption(index)}
                      className="mr-2"
                    />
                  )}
                  <span className="text-sm font-medium text-gray-700">
                    {option}
                  </span>
                </label>
                <span className="text-sm text-gray-500">
                  {voteCount} ({percentage.toFixed(1)}%)
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${barWidth}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {poll.isActive && selectedOption !== null && (
          <button
            onClick={handleVote}
            disabled={voting}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {voting ? "Voting..." : "Cast Vote"}
          </button>
        )}

        {poll.isActive && isCreator && (
          <button
            onClick={handleClosePoll}
            disabled={closing}
            className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {closing ? "Closing..." : "Close Poll"}
          </button>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-400">
        Created: {new Date(poll.createdAt).toLocaleDateString()}
        {poll.closedAt && (
          <span> • Closed: {new Date(poll.closedAt).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
};

export default PollCard;
