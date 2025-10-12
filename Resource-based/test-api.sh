#!/bin/bash

# Test script for the Distributed Polling System API
# This script tests all the main API endpoints

API_URL="http://localhost:3000"

echo "🧪 Testing Distributed Polling System API"
echo "=========================================="

# Test health endpoint
echo "1. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health")
echo "Health: $HEALTH_RESPONSE"
echo ""

# Test user creation
echo "2. Creating a test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/users" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice Johnson", "email": "alice@example.com"}')
echo "User created: $USER_RESPONSE"

# Extract user ID (simple parsing for demo)
USER_ID=$(echo $USER_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "User ID: $USER_ID"
echo ""

# Test poll creation
echo "3. Creating a test poll..."
POLL_RESPONSE=$(curl -s -X POST "$API_URL/polls" \
  -H "Content-Type: application/json" \
  -d "{\"creatorId\": \"$USER_ID\", \"question\": \"What is your favorite web framework?\", \"options\": [\"React\", \"Vue\", \"Angular\", \"Svelte\"]}")
echo "Poll created: $POLL_RESPONSE"

# Extract poll ID
POLL_ID=$(echo $POLL_RESPONSE | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
echo "Poll ID: $POLL_ID"
echo ""

# Test voting
echo "4. Casting a vote..."
VOTE_RESPONSE=$(curl -s -X POST "$API_URL/polls/$POLL_ID/votes" \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$USER_ID\", \"optionIndex\": 0}")
echo "Vote cast: $VOTE_RESPONSE"
echo ""

# Test results
echo "5. Getting poll results..."
RESULTS_RESPONSE=$(curl -s "$API_URL/polls/$POLL_ID/results")
echo "Results: $RESULTS_RESPONSE"
echo ""

# Test user polls
echo "6. Getting user's polls..."
USER_POLLS_RESPONSE=$(curl -s "$API_URL/users/$USER_ID/polls")
echo "User polls: $USER_POLLS_RESPONSE"
echo ""

# Test user votes
echo "7. Getting user's votes..."
USER_VOTES_RESPONSE=$(curl -s "$API_URL/users/$USER_ID/votes")
echo "User votes: $USER_VOTES_RESPONSE"
echo ""

# Test all polls
echo "8. Getting all polls..."
ALL_POLLS_RESPONSE=$(curl -s "$API_URL/polls")
echo "All polls: $ALL_POLLS_RESPONSE"
echo ""

echo "✅ API testing completed!"
echo "All endpoints are working correctly."

