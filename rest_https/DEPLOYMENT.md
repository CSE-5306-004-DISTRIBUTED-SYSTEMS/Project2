# Deployment Guide - Distributed Polling System

This guide provides step-by-step instructions for deploying the distributed polling system in different environments.

## 🚀 Quick Start (Development)

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd Resource-based
```

### 2. Start All Services

```bash
# Start all services with Docker Compose
docker-compose up --build

# Or start in detached mode
docker-compose up -d --build
```

### 3. Verify Deployment

```bash
# Test the API
./test-api.sh

# Check service health
curl http://localhost:3000/health  # API
curl http://localhost:3001/health  # Middleware
```

### 4. Access the Application

- **Frontend**: http://localhost:3002
- **API**: http://localhost:3000
- **Middleware**: http://localhost:3001
- **Database Shard 1**: localhost:3306
- **Database Shard 2**: localhost:3307

## 🏗️ Production Deployment

### Environment Variables

Create a `.env` file in the root directory:

```env
# API Configuration
API_PORT=3000
NODE_ENV=production

# Middleware Configuration
MIDDLEWARE_PORT=3001

# Database Shard 1
DB1_HOST=db-shard-1
DB1_PORT=3306
DB1_USER=polling_user
DB1_PASSWORD=your_secure_password_1
DB1_NAME=polling_shard_1

# Database Shard 2
DB2_HOST=db-shard-2
DB2_PORT=3306
DB2_USER=polling_user
DB2_PASSWORD=your_secure_password_2
DB2_NAME=polling_shard_2

# Database Root Passwords
DB1_ROOT_PASSWORD=your_root_password_1
DB2_ROOT_PASSWORD=your_root_password_2

# Frontend Configuration
REACT_APP_API_URL=https://your-api-domain.com
```

### Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  db-shard-1:
    image: mariadb:10.11
    container_name: polling-db-shard-1
    environment:
      MYSQL_ROOT_PASSWORD: ${DB1_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB1_NAME}
      MYSQL_USER: ${DB1_USER}
      MYSQL_PASSWORD: ${DB1_PASSWORD}
    volumes:
      - db1_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - polling-network
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "mysqladmin",
          "ping",
          "-h",
          "localhost",
          "-u",
          "${DB1_USER}",
          "-p${DB1_PASSWORD}",
        ]
      timeout: 20s
      retries: 10
      interval: 10s

  db-shard-2:
    image: mariadb:10.11
    container_name: polling-db-shard-2
    environment:
      MYSQL_ROOT_PASSWORD: ${DB2_ROOT_PASSWORD}
      MYSQL_DATABASE: ${DB2_NAME}
      MYSQL_USER: ${DB2_USER}
      MYSQL_PASSWORD: ${DB2_PASSWORD}
    volumes:
      - db2_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - polling-network
    restart: unless-stopped
    healthcheck:
      test:
        [
          "CMD",
          "mysqladmin",
          "ping",
          "-h",
          "localhost",
          "-u",
          "${DB2_USER}",
          "-p${DB2_PASSWORD}",
        ]
      timeout: 20s
      retries: 10
      interval: 10s

  middleware:
    build:
      context: ./middleware
      dockerfile: Dockerfile
    container_name: polling-middleware
    environment:
      NODE_ENV: production
      PORT: ${MIDDLEWARE_PORT}
      DB1_HOST: db-shard-1
      DB1_PORT: 3306
      DB1_USER: ${DB1_USER}
      DB1_PASSWORD: ${DB1_PASSWORD}
      DB1_NAME: ${DB1_NAME}
      DB2_HOST: db-shard-2
      DB2_PORT: 3306
      DB2_USER: ${DB2_USER}
      DB2_PASSWORD: ${DB2_PASSWORD}
      DB2_NAME: ${DB2_NAME}
    depends_on:
      db-shard-1:
        condition: service_healthy
      db-shard-2:
        condition: service_healthy
    networks:
      - polling-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${MIDDLEWARE_PORT}/health"]
      timeout: 10s
      retries: 5
      interval: 30s

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    container_name: polling-api
    environment:
      NODE_ENV: production
      PORT: ${API_PORT}
      MIDDLEWARE_URL: http://middleware:${MIDDLEWARE_PORT}
    depends_on:
      middleware:
        condition: service_healthy
    networks:
      - polling-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${API_PORT}/health"]
      timeout: 10s
      retries: 5
      interval: 30s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        REACT_APP_API_URL: ${REACT_APP_API_URL}
    container_name: polling-frontend
    depends_on:
      - api
    networks:
      - polling-network
    restart: unless-stopped

  # Reverse Proxy (Nginx)
  nginx:
    image: nginx:alpine
    container_name: polling-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
    networks:
      - polling-network
    restart: unless-stopped

volumes:
  db1_data:
    driver: local
  db2_data:
    driver: local

networks:
  polling-network:
    driver: bridge
```

### Nginx Configuration

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api {
        server api:3000;
    }

    upstream frontend {
        server frontend:80;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS configuration
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # API routes
        location /api/ {
            rewrite ^/api/(.*) /$1 break;
            proxy_pass http://api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## ☁️ Cloud Deployment Options

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Build and push images to ECR**:

```bash
# Create ECR repositories
aws ecr create-repository --repository-name polling-api
aws ecr create-repository --repository-name polling-middleware
aws ecr create-repository --repository-name polling-frontend

# Build and push images
docker build -t polling-api ./api
docker tag polling-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/polling-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/polling-api:latest
```

2. **Set up RDS for databases**:

   - Create two RDS MariaDB instances for sharding
   - Configure security groups and VPC
   - Update connection strings in environment variables

3. **Deploy with ECS**:
   - Create ECS cluster
   - Define task definitions for each service
   - Set up Application Load Balancer
   - Configure auto-scaling

#### Using EKS (Kubernetes)

Create Kubernetes manifests in `k8s/` directory:

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: polling-system

---
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: polling-api
  namespace: polling-system
spec:
  replicas: 3
  selector:
    matchLabels:
      app: polling-api
  template:
    metadata:
      labels:
        app: polling-api
    spec:
      containers:
        - name: api
          image: <account-id>.dkr.ecr.<region>.amazonaws.com/polling-api:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: MIDDLEWARE_URL
              value: "http://polling-middleware:3001"
```

### Google Cloud Platform

1. **Use Cloud Run for serverless deployment**:

```bash
# Build and deploy API
gcloud builds submit --tag gcr.io/PROJECT-ID/polling-api ./api
gcloud run deploy polling-api --image gcr.io/PROJECT-ID/polling-api --platform managed

# Build and deploy middleware
gcloud builds submit --tag gcr.io/PROJECT-ID/polling-middleware ./middleware
gcloud run deploy polling-middleware --image gcr.io/PROJECT-ID/polling-middleware --platform managed
```

2. **Use Cloud SQL for databases**:
   - Create Cloud SQL MariaDB instances
   - Configure private IP and authorized networks
   - Update connection strings

### Azure Deployment

1. **Use Container Instances**:

```bash
# Create resource group
az group create --name polling-system --location eastus

# Deploy containers
az container create --resource-group polling-system --name polling-api \
  --image your-registry/polling-api:latest --ports 3000
```

2. **Use Azure Database for MariaDB**:
   - Create managed MariaDB instances
   - Configure firewall rules
   - Update connection strings

## 🔧 Configuration Management

### Environment-Specific Configurations

Create separate configuration files:

```javascript
// config/development.js
module.exports = {
  api: {
    port: 3000,
    cors: {
      origin: "http://localhost:3002",
    },
  },
  database: {
    shards: [
      {
        host: "localhost",
        port: 3306,
        user: "polling_user",
        password: "polling_password",
        database: "polling_shard_1",
      },
    ],
  },
};

// config/production.js
module.exports = {
  api: {
    port: process.env.PORT || 3000,
    cors: {
      origin: process.env.FRONTEND_URL,
    },
  },
  database: {
    shards: [
      {
        host: process.env.DB1_HOST,
        port: process.env.DB1_PORT,
        user: process.env.DB1_USER,
        password: process.env.DB1_PASSWORD,
        database: process.env.DB1_NAME,
      },
    ],
  },
};
```

## 📊 Monitoring and Logging

### Health Checks

All services provide health check endpoints:

- API: `GET /health`
- Middleware: `GET /health`

### Logging

Configure structured logging:

```javascript
// utils/logger.js
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

module.exports = logger;
```

### Metrics

Implement metrics collection:

```javascript
// middleware/metrics.js
const promClient = require("prom-client");

const httpRequestDuration = new promClient.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});

const databaseQueryDuration = new promClient.Histogram({
  name: "database_query_duration_seconds",
  help: "Duration of database queries in seconds",
  labelNames: ["shard", "operation"],
});

module.exports = {
  httpRequestDuration,
  databaseQueryDuration,
  register: promClient.register,
};
```

## 🔒 Security Considerations

### Production Security Checklist

- [ ] Use HTTPS/TLS for all communications
- [ ] Implement rate limiting
- [ ] Add authentication and authorization
- [ ] Validate and sanitize all inputs
- [ ] Use environment variables for secrets
- [ ] Enable CORS with specific origins
- [ ] Implement request logging and monitoring
- [ ] Use security headers (helmet.js)
- [ ] Regular security updates
- [ ] Database connection encryption

### Example Security Middleware

```javascript
// middleware/security.js
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use(helmet());
app.use(limiter);
```

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 3000, 3001, 3002, 3306, 3307 are available
2. **Database connection errors**: Check database credentials and network connectivity
3. **CORS errors**: Verify frontend URL in API CORS configuration
4. **Build failures**: Ensure Node.js version compatibility

### Debug Commands

```bash
# Check container logs
docker-compose logs api
docker-compose logs middleware
docker-compose logs db-shard-1

# Check container status
docker-compose ps

# Restart specific service
docker-compose restart api

# Rebuild and restart
docker-compose up --build api
```

## 📈 Scaling

### Horizontal Scaling

1. **Add more database shards**:

   - Update middleware configuration
   - Add new database containers
   - Redistribute existing data (if needed)

2. **Scale API instances**:

   - Use load balancer
   - Deploy multiple API containers
   - Implement session management

3. **Frontend scaling**:
   - Use CDN for static assets
   - Implement caching strategies
   - Optimize bundle size

### Performance Optimization

- Enable database query caching
- Implement Redis for session storage
- Use connection pooling
- Optimize database indexes
- Implement API response caching

This deployment guide provides comprehensive instructions for deploying the distributed polling system in various environments, from development to production cloud deployments.
