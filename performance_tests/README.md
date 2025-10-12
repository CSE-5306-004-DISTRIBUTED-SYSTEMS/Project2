# Simple Performance Testing Scripts

Simple performance testing scripts for both REST API and gRPC microservice architectures to generate latency and throughput data for the Report.md evaluation section.

## Quick Start

1. **Set up Python virtual environment:**

   ```bash
   cd performance_tests
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install aiohttp
   ```

2. **Start your system (choose one):**

   **For REST API testing:**

   ```bash
   cd ../rest_https
   docker-compose up --build
   ```

   **For gRPC testing:**

   ```bash
   cd ../microservice_rpc
   docker-compose up --build
   ```

3. **Run the performance tests:**

   ```bash
   cd ../performance_tests
   source venv/bin/activate  # On Windows: venv\Scripts\activate

   # For REST API testing
   python simple_test_runner.py

   # For gRPC testing
   python grpc_test_runner.py
   ```

## What It Tests

- **Voting scenario**: Multiple users voting simultaneously (write-heavy)
- **Results scenario**: Multiple users getting poll results simultaneously (read-heavy)
- **User counts**: 10, 50, 100, 500, 1000 concurrent users
- **Metrics**: Average latency (ms) and throughput (requests/second)

## Output

The script generates:

- Console output with real-time progress
- JSON file with detailed results
- Formatted table ready to copy into Report.md tables

## Files

**REST API Testing:**

- `rest_api_performance.py` - REST API performance testing script
- `simple_test_runner.py` - REST API test runner

**gRPC Testing:**

- `grpc_performance.py` - gRPC performance testing script
- `grpc_test_runner.py` - gRPC test runner

**Visualization:**

- `generate_graphs.py` - Creates comparison graphs from JSON results

## Requirements

- Python 3.7+
- aiohttp library (for REST API testing)
- grpcio library (for gRPC testing)
- matplotlib and numpy (for graph generation)
- REST API running on localhost:3005 (for REST testing)
- gRPC service running on localhost:8080 (for gRPC testing)

## Usage

```bash
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate

# REST API Testing
python simple_test_runner.py
# Or run directly with custom user counts
python rest_api_performance.py --users 10 50 100

# gRPC Testing
python grpc_test_runner.py
# Or run directly with custom user counts
python grpc_performance.py --users 10 50 100

# Generate comparison graphs
python generate_graphs.py
```
