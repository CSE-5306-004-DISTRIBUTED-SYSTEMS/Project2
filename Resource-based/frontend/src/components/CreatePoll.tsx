import React, { useState } from "react";
import { pollApi } from "../api";

interface CreatePollProps {
  onPollCreated: () => void;
}

const CreatePoll: React.FC<CreatePollProps> = ({ onPollCreated }) => {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const addOption = () => {
    setOptions([...options, ""]);
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Question is required");
      return;
    }

    const validOptions = options.filter((opt) => opt.trim());
    if (validOptions.length < 2) {
      setError("At least 2 options are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await pollApi.create(question.trim(), validOptions);
      setQuestion("");
      setOptions(["", ""]);
      onPollCreated();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Create New Poll</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="question"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Poll Question
          </label>
          <input
            type="text"
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your poll question..."
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Options
          </label>
          {options.map((option, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={option}
                onChange={(e) => updateOption(index, e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Option ${index + 1}`}
                disabled={isSubmitting}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addOption}
            className="text-blue-500 hover:text-blue-700 text-sm disabled:opacity-50"
            disabled={isSubmitting}
          >
            + Add Option
          </button>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating..." : "Create Poll"}
        </button>
      </form>
    </div>
  );
};

export default CreatePoll;
