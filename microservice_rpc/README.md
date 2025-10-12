# gRPC Microservice Architecture

A distributed polling system using gRPC microservices with database replication for high availability.

## 🏗️ Architecture

The system consists of:

- **Primary gRPC Server**: Handles requests on port 50051
- **Backup gRPC Server**: Handles requests on port 50052
- **Load Balancer (Nginx)**: Distributes gRPC requests on port 8080
- **Primary Database**: PostgreSQL master on port 5432
- **Replica Database**: PostgreSQL replica on port 5433

## 🚀 Quick Start

1. **Start all services:**

   ```bash
   cd microservice_rpc
   docker-compose up --build
   ```

2. **Access the system:**
   - gRPC endpoint: `localhost:8080`
   - Primary database: `localhost:5432`
   - Replica database: `localhost:5433`

## 🧪 Testing

Run the performance tests from the `performance_tests` directory:

```bash
cd ../performance_tests
source venv/bin/activate
python grpc_test_runner.py
```

## 📊 Services

| Service        | Port  | Description              |
| -------------- | ----- | ------------------------ |
| Load Balancer  | 8080  | Nginx gRPC load balancer |
| Primary Server | 50051 | Main gRPC server         |
| Backup Server  | 50052 | Backup gRPC server       |
| Primary DB     | 5432  | PostgreSQL master        |
| Replica DB     | 5433  | PostgreSQL replica       |

## 🔧 Configuration

- **Database**: PostgreSQL 13 with streaming replication
- **Load Balancing**: Round-robin distribution between servers
- **Health Checks**: All services have health monitoring
- **Networking**: Isolated bridge network for service communication

## 📝 Notes

- The system automatically sets up database replication
- Health checks ensure services are ready before accepting traffic
- Both gRPC servers connect to their respective databases (primary/replica)
- Nginx load balancer distributes requests between both servers
