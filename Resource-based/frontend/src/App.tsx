import React, { useState, useEffect } from "react";
import CreatePoll from "./components/CreatePoll";
import PollList from "./components/PollList";
import { healthApi } from "./api";

function App() {
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const checkHealth = async () => {
    try {
      const health = await healthApi.check();
      setHealthStatus(health);
    } catch (error) {
      console.error("Health check failed:", error);
      setHealthStatus({ status: "unhealthy", error: "Connection failed" });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handlePollCreated = () => {
    // PollList will automatically refresh when a poll is created
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Distributed Polling System
          </h1>
          <p className="text-gray-600">
            Create polls, vote, and see real-time results across multiple
            servers
          </p>
          {healthStatus && (
            <div className="mt-2 text-sm">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  healthStatus.status === "healthy"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {healthStatus.status === "healthy" ? "✓" : "✗"}
                {healthStatus.instance || "API"} - {healthStatus.status}
              </span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Poll Form */}
          <div className="lg:col-span-1">
            <CreatePoll onPollCreated={handlePollCreated} />
          </div>

          {/* Poll List */}
          <div className="lg:col-span-2">
            <PollList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Load Balanced Distributed Polling System</p>
          <p>Frontend → Load Balancer → API Instance 1/2 → PostgreSQL</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
