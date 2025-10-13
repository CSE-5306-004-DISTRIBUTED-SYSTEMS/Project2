# gRPC Microservice Architecture

A distributed polling system using gRPC microservices with database replication for high availability.

## 🏗️ Architecture

The system consists of:

- **Primary gRPC Server**: Handles requests on port 50051
- **Backup gRPC Server**: Handles requests on port 50052
- **Load Balancer (Nginx)**: Distributes gRPC requests on port 8080
- **Primary Database**: PostgreSQL master on port 5432
- **Replica Database**: PostgreSQL replica with internal connection

## 🚀 Quick Start

**1. Start all services:**

##### pull images 
- `docker pull johncxsong/primary-database-node4` 
- `docker pull johncxsong/replica-database-node5`
- `docker pull johncxsong/backup-server-node3`
- `docker pull johncxsong/primary-server-node2`
- `docker pull johncxsong/load-balance-node1`

##### Run 
1. `docker network create voting-net`  create a network
2. `docker run --name db-primary \
  --network voting-net \
  -p 5432:5432 \
  johncxsong/primary-database-node4` running database

3. `docker run --name db-replica \
  --network voting-net \
  --link db-primary:db-primary \
  johncxsong/replica-database-node5` running replica databse

4. `docker run --network voting-net --name primary -p 50051:50051 johncxsong/primary-server-node2` running main server

5. `docker run --network voting-net --name backup -p 50052:50052 johncxsong/backup-server-node3` running backup server

6. `docker run --network voting-net --name loader -p 8080:8080 johncxsong/load-balance-node1` running load balance

7. `pip install -r ./app/requirement.txt` install test enviroment 



**2. Access the system:**
   - gRPC endpoint: `localhost:8080`
   - Primary-standby database: `localhost:5432`
   - **Replica Database**: internal

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
>>>>>>> main

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
| Replica DB     | internal | PostgreSQL replica       |



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
