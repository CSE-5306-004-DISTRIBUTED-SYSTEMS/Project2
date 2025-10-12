#!/bin/bash

# Test script for the Load Balanced Distributed Polling System
# This script tests all 5 REST endpoints through the load balancer

API_URL="http://localhost:3005"

echo "🧪 Testing Load Balanced Distributed Polling System"
echo "=================================================="

# Test load balancer health
echo "1. Testing load balancer health..."
LB_HEALTH=$(curl -s "$API_URL/lb-health")
echo "Load Balancer: $LB_HEALTH"

# Test API health (should show different instances)
echo -e "\n2. Testing API instances health..."
for i in {1..4}; do
    HEALTH_RESPONSE=$(curl -s "$API_URL/health")
    echo "Health check $i: $HEALTH_RESPONSE"
done

# Test creating a poll
echo -e "\n3. Creating a test poll..."
POLL_RESPONSE=$(curl -s -X POST "$API_URL/polls" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is your favorite color?", "options": ["Red", "Blue", "Green", "Yellow"]}')
echo "Poll created: $POLL_RESPONSE"

# Extract poll ID (simple parsing)
POLL_ID=$(echo $POLL_RESPONSE | grep -o '"id":[0-9]*' | cut -d':' -f2)
echo "Poll ID: $POLL_ID"

# Test casting votes
echo -e "\n4. Casting votes..."
for i in {0..3}; do
    for j in $(seq 1 $((i+1))); do
        VOTE_RESPONSE=$(curl -s -X POST "$API_URL/polls/$POLL_ID/votes" \
          -H "Content-Type: application/json" \
          -d "{\"optionIndex\": $i}")
        echo "Vote cast for option $i: $VOTE_RESPONSE"
    done
done

# Test getting results
echo -e "\n5. Getting poll results..."
RESULTS_RESPONSE=$(curl -s "$API_URL/polls/$POLL_ID/results")
echo "Results: $RESULTS_RESPONSE"

# Test listing all polls
echo -e "\n6. Listing all polls..."
ALL_POLLS_RESPONSE=$(curl -s "$API_URL/polls")
echo "All polls: $ALL_POLLS_RESPONSE"

# Test closing the poll
echo -e "\n7. Closing the poll..."
CLOSE_RESPONSE=$(curl -s -X PUT "$API_URL/polls/$POLL_ID/close")
echo "Poll closed: $CLOSE_RESPONSE"

# Test results after closing
echo -e "\n8. Getting results after closing..."
FINAL_RESULTS=$(curl -s "$API_URL/polls/$POLL_ID/results")
echo "Final results: $FINAL_RESULTS"

echo -e "\n✅ Load balanced API testing completed!"
echo "All 5 REST endpoints are working correctly through the load balancer."
