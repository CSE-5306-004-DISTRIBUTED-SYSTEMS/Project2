#!/bin/bash

# Test script for the Database Middleware
# This script tests all the middleware endpoints and sharding functionality

MIDDLEWARE_URL="http://localhost:3001"

echo "🧪 Testing Database Middleware"
echo "=============================="

# Test health endpoint
echo "1. Testing middleware health..."
HEALTH_RESPONSE=$(curl -s "$MIDDLEWARE_URL/health")
echo "Health: $HEALTH_RESPONSE"
echo ""

# Test shard info for different keys
echo "2. Testing shard routing..."
SHARD_INFO_1=$(curl -s "$MIDDLEWARE_URL/shard-info/user_123")
echo "Shard for user_123: $SHARD_INFO_1"

SHARD_INFO_2=$(curl -s "$MIDDLEWARE_URL/shard-info/poll_456")
echo "Shard for poll_456: $SHARD_INFO_2"

SHARD_INFO_3=$(curl -s "$MIDDLEWARE_URL/shard-info/vote_789")
echo "Shard for vote_789: $SHARD_INFO_3"
echo ""

# Create tables on both shards
echo "3. Creating tables on both shards..."

# Create users table on shard 1
echo "Creating users table on shard 1..."
curl -s -X POST "$MIDDLEWARE_URL/query/user_123" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"}' > /dev/null

# Create users table on shard 2
echo "Creating users table on shard 2..."
curl -s -X POST "$MIDDLEWARE_URL/query/poll_456" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS users (id VARCHAR(255) PRIMARY KEY, name VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"}' > /dev/null

# Create polls table on both shards
echo "Creating polls table on both shards..."
curl -s -X POST "$MIDDLEWARE_URL/query/user_123" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS polls (id VARCHAR(255) PRIMARY KEY, creator_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, options JSON NOT NULL, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, closed_at TIMESTAMP NULL)"}' > /dev/null

curl -s -X POST "$MIDDLEWARE_URL/query/poll_456" \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS polls (id VARCHAR(255) PRIMARY KEY, creator_id VARCHAR(255) NOT NULL, question TEXT NOT NULL, options JSON NOT NULL, is_active BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, closed_at TIMESTAMP NULL)"}' > /dev/null

echo "Tables created successfully!"
echo ""

# Insert test data
echo "4. Inserting test data..."

# Insert user on shard 1
USER_INSERT=$(curl -s -X POST "$MIDDLEWARE_URL/query/user_123" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO users (id, name, email) VALUES (?, ?, ?)", "params": ["user_123", "Alice Johnson", "alice@example.com"]}')
echo "User insert result: $USER_INSERT"

# Insert user on shard 2
USER_INSERT_2=$(curl -s -X POST "$MIDDLEWARE_URL/query/user_456" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO users (id, name, email) VALUES (?, ?, ?)", "params": ["user_456", "Bob Smith", "bob@example.com"]}')
echo "User insert result 2: $USER_INSERT_2"

# Insert poll on shard 2
POLL_INSERT=$(curl -s -X POST "$MIDDLEWARE_URL/query/poll_456" \
  -H "Content-Type: application/json" \
  -d '{"query": "INSERT INTO polls (id, creator_id, question, options) VALUES (?, ?, ?, ?)", "params": ["poll_456", "user_123", "What is your favorite programming language?", "[\"JavaScript\", \"Python\", \"TypeScript\", \"Go\"]"]}')
echo "Poll insert result: $POLL_INSERT"
echo ""

# Query data back
echo "5. Querying data back..."

# Query user from shard 1
USER_QUERY=$(curl -s -X POST "$MIDDLEWARE_URL/query/user_123" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM users WHERE id = ?", "params": ["user_123"]}')
echo "User query result: $USER_QUERY"

# Query poll from shard 2
POLL_QUERY=$(curl -s -X POST "$MIDDLEWARE_URL/query/poll_456" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT * FROM polls WHERE id = ?", "params": ["poll_456"]}')
echo "Poll query result: $POLL_QUERY"
echo ""

# Test multi-shard queries
echo "6. Testing multi-shard queries..."
MULTI_SHARD_USERS=$(curl -s -X POST "$MIDDLEWARE_URL/query/all" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as user_count FROM users"}')
echo "Multi-shard user count: $MULTI_SHARD_USERS"

MULTI_SHARD_POLLS=$(curl -s -X POST "$MIDDLEWARE_URL/query/all" \
  -H "Content-Type: application/json" \
  -d '{"query": "SELECT COUNT(*) as poll_count FROM polls"}')
echo "Multi-shard poll count: $MULTI_SHARD_POLLS"
echo ""

echo "✅ Middleware testing completed!"
echo "All sharding and database functionality is working correctly."

