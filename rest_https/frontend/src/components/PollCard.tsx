import React, { useState, useEffect } from "react";
import { pollApi, Poll, PollResults } from "../api";

interface PollCardProps {
  poll: Poll;
  onPollUpdated: () => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onPollUpdated }) => {
  const [results, setResults] = useState<PollResults | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [error, setError] = useState("");
  const [showResults, setShowResults] = useState(!poll.isActive);

  useEffect(() => {
    if (showResults) {
      loadResults();
    }
  }, [poll.id, showResults]);

  const loadResults = async () => {
    try {
      const pollResults = await pollApi.getResults(poll.id);
      setResults(pollResults);
    } catch (err: any) {
      console.error("Failed to load results:", err);
    }
  };

  const handleVote = async (optionIndex: number) => {
    if (!poll.isActive) return;

    setIsVoting(true);
    setError("");

    try {
      await pollApi.vote(poll.id, optionIndex);
      setShowResults(true);
      onPollUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to cast vote");
    } finally {
      setIsVoting(false);
    }
  };

  const handleClosePoll = async () => {
    setIsClosing(true);
    setError("");

    try {
      await pollApi.close(poll.id);
      onPollUpdated();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to close poll");
    } finally {
      setIsClosing(false);
    }
  };

  const toggleResults = () => {
    setShowResults(!showResults);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{poll.question}</h3>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              poll.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {poll.isActive ? "Active" : "Closed"}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded mb-4">
          {error}
        </div>
      )}

      {!showResults && poll.isActive ? (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-3">Cast your vote:</p>
          {poll.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleVote(index)}
              disabled={isVoting}
              className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option}
            </button>
          ))}
        </div>
      ) : (
        results && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Results ({results.totalVotes} vote
                {results.totalVotes !== 1 ? "s" : ""}):
              </p>
            </div>
            {results.options.map((option, index) => {
              const votes = results.votes[index];
              const percentage =
                results.totalVotes > 0 ? (votes / results.totalVotes) * 100 : 0;

              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">{option}</span>
                    <span className="text-gray-500">
                      {votes} vote{votes !== 1 ? "s" : ""} (
                      {percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="text-xs text-gray-500">
          Created: {new Date(poll.createdAt).toLocaleDateString()}
          {poll.closedAt && (
            <span>
              {" "}
              • Closed: {new Date(poll.closedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {poll.isActive && (
            <button
              onClick={toggleResults}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showResults ? "Vote" : "View Results"}
            </button>
          )}

          {poll.isActive && (
            <button
              onClick={handleClosePoll}
              disabled={isClosing}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {isClosing ? "Closing..." : "Close Poll"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PollCard;
