# Simple Performance Testing Scripts

Simple performance testing scripts for the REST API architecture to generate latency and throughput data for the Report.md evaluation section.

## Quick Start

1. **Set up Python virtual environment:**

   ```bash
   cd performance_tests
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install aiohttp
   ```

2. **Start your REST API system:**

   ```bash
   cd ../rest_https
   docker-compose up --build
   ```

3. **Run the performance tests:**
   ```bash
   cd ../performance_tests
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   python simple_test_runner.py
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

- `rest_api_performance.py` - Main performance testing script (simplified)
- `simple_test_runner.py` - Easy-to-use test runner

## Requirements

- Python 3.7+
- aiohttp library (installed automatically)
- REST API running on localhost:3005

## Usage

```bash
# Activate virtual environment first
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Run all tests with default user counts
python simple_test_runner.py

# Or run directly with custom user counts
python rest_api_performance.py --users 10 50 100
```
