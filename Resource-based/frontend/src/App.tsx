import React, { useState } from "react";
import { User, Poll } from "./types";
import CreateUser from "./components/CreateUser";
import CreatePoll from "./components/CreatePoll";
import PollList from "./components/PollList";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
  };

  const handlePollCreated = (poll: Poll) => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Distributed Polling System
              </h1>
              <p className="text-gray-600">
                Create polls, cast votes, see results
              </p>
            </div>
            {currentUser && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, <strong>{currentUser.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!currentUser ? (
          <div className="max-w-md mx-auto">
            <CreateUser onUserCreated={handleUserCreated} />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-8 lg:grid-cols-2">
              <CreatePoll
                user={currentUser}
                onPollCreated={handlePollCreated}
              />
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                  Your Account
                </h2>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Name:</strong> {currentUser.name}
                  </p>
                  <p>
                    <strong>Email:</strong> {currentUser.email}
                  </p>
                  <p>
                    <strong>User ID:</strong> {currentUser.id}
                  </p>
                  <p>
                    <strong>Member since:</strong>{" "}
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <PollList user={currentUser} refreshTrigger={refreshTrigger} />
          </div>
        )}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-gray-500 text-sm">
            Distributed Polling System - Resource-based Architecture with REST
            API
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
