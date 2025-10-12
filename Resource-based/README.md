# Distributed Polling System - Resource-Based Architecture

A scalable, distributed polling/voting system built with a resource-based REST API architecture. The system supports horizontal scaling through database sharding and provides a clean separation between frontend, API, middleware, and database layers.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Layer     │    │   Middleware    │    │   Database      │
│   (React)       │───▶│   (Hono)        │───▶│   (Sharding)    │───▶│   (MariaDB)     │
│   Port: 3002    │    │   Port: 3000    │    │   Port: 3001    │    │   Ports: 3306/7 │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### System Components

1. **Frontend**: Lightweight React application with TypeScript and Tailwind CSS
2. **API Layer**: Hono-based REST service with resource-based endpoints
3. **Middleware Layer**: Database routing and sharding management
4. **Database Layer**: Two MariaDB containers for horizontal scaling

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- npm or yarn

### Running the Complete System

1. **Clone and navigate to the project:**

   ```bash
   cd Resource-based
   ```

2. **Start all services with Docker Compose:**

   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3002
   - API: http://localhost:3000
   - Middleware: http://localhost:3001
   - Database Shard 1: localhost:3306
   - Database Shard 2: localhost:3307

### Development Mode

To run individual services in development mode:

1. **API Service:**

   ```bash
   cd api
   npm install
   npm run dev
   ```

2. **Middleware Service:**

   ```bash
   cd middleware
   npm install
   npm run dev
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

## 📋 API Endpoints

### Users

- `POST /users` - Create a user
- `GET /users/{userId}` - Get user details
- `GET /users/{userId}/polls` - List polls created by user
- `GET /users/{userId}/votes` - List votes cast by user

### Polls

- `POST /polls` - Create a new poll
- `GET /polls` - List all polls
- `GET /polls/{pollId}` - Get details for a specific poll
- `PUT /polls/{pollId}/close` - Close a poll (creator only)

### Votes

- `POST /polls/{pollId}/votes` - Cast a vote on a poll
- `GET /polls/{pollId}/results` - Get current results for a poll

### Health Checks

- `GET /` - API status
- `GET /health` - Detailed health information

## 🗄️ Database Schema

The system uses MariaDB with the following tables:

### Users Table

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Polls Table

```sql
CREATE TABLE polls (
    id VARCHAR(255) PRIMARY KEY,
    creator_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

### Votes Table

```sql
CREATE TABLE votes (
    id VARCHAR(255) PRIMARY KEY,
    poll_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    option_index INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_poll (user_id, poll_id),
    FOREIGN KEY (poll_id) REFERENCES polls(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🔄 Sharding Strategy

The middleware layer implements hash-based sharding:

1. **Hash Function**: Simple string hash based on poll/user IDs
2. **Shard Selection**: `hash(key) % shard_count`
3. **Load Distribution**: Evenly distributes data across available shards
4. **Fault Tolerance**: Continues operation even if one shard is unavailable

### Middleware Endpoints

- `POST /query/{shardKey}` - Execute query on shard determined by key
- `POST /query/shard/{shardIndex}` - Execute query on specific shard
- `POST /query/all` - Execute query on all shards (aggregation)
- `GET /shard-info/{key}` - Get shard information for a key
- `GET /health` - Check health of all database shards

## 🎨 Frontend Features

- **User Management**: Create accounts and manage user sessions
- **Poll Creation**: Create polls with multiple options
- **Voting Interface**: Cast votes with real-time result visualization
- **Results Display**: Interactive charts showing vote distribution
- **Poll Management**: Close polls (creator only)
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS

## 🔧 Configuration

### Environment Variables

#### API Service

- `PORT` - API server port (default: 3000)
- `NODE_ENV` - Environment mode
- `MIDDLEWARE_URL` - Middleware service URL

#### Middleware Service

- `PORT` - Middleware server port (default: 3001)
- `DB1_HOST`, `DB1_PORT`, `DB1_USER`, `DB1_PASSWORD`, `DB1_NAME` - Shard 1 config
- `DB2_HOST`, `DB2_PORT`, `DB2_USER`, `DB2_PASSWORD`, `DB2_NAME` - Shard 2 config

#### Frontend

- `REACT_APP_API_URL` - API service URL (default: http://localhost:3000)

## 🧪 Testing

### API Testing with curl

1. **Create a user:**

   ```bash
   curl -X POST http://localhost:3000/users \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe", "email": "john@example.com"}'
   ```

2. **Create a poll:**

   ```bash
   curl -X POST http://localhost:3000/polls \
     -H "Content-Type: application/json" \
     -d '{
       "creatorId": "user_id_here",
       "question": "What is your favorite color?",
       "options": ["Red", "Blue", "Green", "Yellow"]
     }'
   ```

3. **Cast a vote:**

   ```bash
   curl -X POST http://localhost:3000/polls/poll_id_here/votes \
     -H "Content-Type: application/json" \
     -d '{"userId": "user_id_here", "optionIndex": 0}'
   ```

4. **Get results:**
   ```bash
   curl http://localhost:3000/polls/poll_id_here/results
   ```

### Health Checks

- API Health: `curl http://localhost:3000/health`
- Middleware Health: `curl http://localhost:3001/health`

## 📊 Monitoring

The system provides health check endpoints for monitoring:

- **API Status**: Shows uptime and basic system information
- **Database Health**: Monitors connection status to all database shards
- **Middleware Status**: Reports on sharding service health

## 🔒 Security Considerations

- Input validation on all API endpoints
- SQL injection prevention through parameterized queries
- CORS configuration for cross-origin requests
- Rate limiting (recommended for production)
- Authentication/authorization (to be implemented)

## 🚀 Deployment

### Production Deployment

1. **Update environment variables** in `docker-compose.yml`
2. **Configure proper database credentials**
3. **Set up reverse proxy** (nginx/Apache) for the frontend
4. **Enable SSL/TLS** for secure communication
5. **Configure monitoring** and logging solutions

### Scaling

- **Horizontal Scaling**: Add more database shards by updating middleware configuration
- **Load Balancing**: Deploy multiple API instances behind a load balancer
- **Caching**: Implement Redis for session management and caching
- **CDN**: Use CDN for static frontend assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🔍 Troubleshooting

### Common Issues

1. **Database Connection Errors**: Check if MariaDB containers are running and accessible
2. **Port Conflicts**: Ensure ports 3000, 3001, 3002, 3306, 3307 are available
3. **Build Failures**: Run `npm install` in each service directory
4. **CORS Issues**: Verify API_URL configuration in frontend environment

### Logs

View logs for specific services:

```bash
docker-compose logs api
docker-compose logs middleware
docker-compose logs db-shard-1
docker-compose logs db-shard-2
```

## 📈 Performance

- **Database Indexing**: Optimized indexes on frequently queried columns
- **Connection Pooling**: Efficient database connection management
- **Caching Strategy**: Results caching for improved response times
- **Horizontal Scaling**: Sharding enables linear scaling with data growth
