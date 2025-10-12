#!/usr/bin/env python3
"""
Simple Performance Testing Script for gRPC Microservice Architecture
Tests latency and throughput for voting and results scenarios
"""

import grpc
import time
import json
import statistics
import argparse
from datetime import datetime
from typing import List, Dict, Tuple
import sys
import os
import random
import threading
import queue
import uuid

# Add the microservice app directory to the path for imports
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'microservice_rpc', 'app'))

try:
    import polling_pb2
    import polling_pb2_grpc
except ImportError:
    print("❌ Error: gRPC protobuf files not found.")
    print("Please ensure you're in the correct directory and protobuf files are generated.")
    print("Run this from the performance_tests directory.")
    sys.exit(1)

class gRPCPerformanceTester:
    def __init__(self, server_url: str = "localhost:8080"):
        self.server_url = server_url
        self.channel = None
        self.poll_stub = None
        self.vote_stub = None
        self.result_stub = None
        self.test_poll_uuid = None
        
    def __enter__(self):
        self.channel = grpc.insecure_channel(self.server_url)
        self.poll_stub = polling_pb2_grpc.PollServiceStub(self.channel)
        self.vote_stub = polling_pb2_grpc.VoteServiceStub(self.channel)
        self.result_stub = polling_pb2_grpc.ResultServiceStub(self.channel)
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.channel:
            self.channel.close()
    
    def create_test_poll(self) -> str:
        """Create a test poll for performance testing"""
        create_request = polling_pb2.CreatePollRequest(
            poll_questions="Performance Test Poll - What is your favorite programming language?",
            options=["Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C#"]
        )
        
        start_time = time.time()
        try:
            response = self.poll_stub.CreatePoll(create_request)
            end_time = time.time()
            
            self.test_poll_uuid = response.uuid
            print(f"✅ Test poll created with UUID: {self.test_poll_uuid}")
            return response.uuid
        except grpc.RpcError as e:
            end_time = time.time()
            raise Exception(f"Failed to create test poll: {e.code()} - {e.details()}")
    
    def cast_vote(self, user_id: str, selected_option: str) -> Tuple[float, bool]:
        """Cast a single vote and return latency and success status"""
        vote_request = polling_pb2.CastVoteRequest(
            uuid=self.test_poll_uuid,
            userID=user_id,
            select_options=selected_option
        )
        
        start_time = time.time()
        try:
            response = self.vote_stub.CastVote(vote_request)
            end_time = time.time()
            latency = end_time - start_time
            
            success = "Successfully" in response.status
            return latency, success
        except grpc.RpcError as e:
            end_time = time.time()
            return end_time - start_time, False
    
    def get_poll_results(self) -> Tuple[float, bool]:
        """Get poll results and return latency and success status"""
        result_request = polling_pb2.PollRequest(uuid=self.test_poll_uuid)
        
        start_time = time.time()
        try:
            response = self.result_stub.GetPollResults(result_request)
            end_time = time.time()
            latency = end_time - start_time
            
            return latency, True
        except grpc.RpcError as e:
            end_time = time.time()
            return end_time - start_time, False
    
    def test_write_heavy_scenario(self, num_users: int) -> Dict:
        """Test write-heavy scenario (voting) using threading"""
        print(f"Testing {num_users} concurrent votes...")
        
        # Create test poll
        self.create_test_poll()
        
        # Generate random user IDs and options for each user
        user_ids = [f"user_{i}_{uuid.uuid4().hex[:8]}" for i in range(num_users)]
        options = ["Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C#"]
        selected_options = [random.choice(options) for _ in range(num_users)]
        
        # Execute concurrent votes using threading
        results_queue = queue.Queue()
        threads = []
        
        def vote_worker(user_id, option):
            latency, success = self.cast_vote(user_id, option)
            results_queue.put((latency, success))
        
        start_time = time.time()
        for i in range(num_users):
            thread = threading.Thread(target=vote_worker, args=(user_ids[i], selected_options[i]))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        
        # Process results - focus on latency and throughput only
        latencies = []
        successful_requests = 0
        
        while not results_queue.empty():
            latency, success = results_queue.get()
            latencies.append(latency)
            if success:
                successful_requests += 1
        
        total_time = end_time - start_time
        avg_latency = statistics.mean(latencies) if latencies else 0
        throughput = successful_requests / total_time if total_time > 0 else 0
        
        return {
            "num_users": num_users,
            "avg_latency": avg_latency,
            "throughput": throughput
        }
    
    def test_read_heavy_scenario(self, num_users: int) -> Dict:
        """Test read-heavy scenario (getting results) using threading"""
        print(f"Testing {num_users} concurrent result requests...")
        
        # Ensure we have a test poll with some votes
        if not self.test_poll_uuid:
            self.create_test_poll()
            # Add some initial votes
            for i in range(10):
                user_id = f"init_user_{i}_{uuid.uuid4().hex[:8]}"
                self.cast_vote(user_id, "Python")
        
        # Execute concurrent result requests using threading
        results_queue = queue.Queue()
        threads = []
        
        def result_worker():
            latency, success = self.get_poll_results()
            results_queue.put((latency, success))
        
        start_time = time.time()
        for _ in range(num_users):
            thread = threading.Thread(target=result_worker)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        
        # Process results - focus on latency and throughput only
        latencies = []
        successful_requests = 0
        
        while not results_queue.empty():
            latency, success = results_queue.get()
            latencies.append(latency)
            if success:
                successful_requests += 1
        
        total_time = end_time - start_time
        avg_latency = statistics.mean(latencies) if latencies else 0
        throughput = successful_requests / total_time if total_time > 0 else 0
        
        return {
            "num_users": num_users,
            "avg_latency": avg_latency,
            "throughput": throughput
        }
    
    def print_results(self, results: Dict):
        """Print simplified results"""
        print(f"  Users: {results['num_users']}, Latency: {results['avg_latency']*1000:.2f}ms, Throughput: {results['throughput']:.2f} req/s")

def run_performance_tests():
    """Run simple performance tests focusing on latency and throughput"""
    parser = argparse.ArgumentParser(description="Simple gRPC Performance Testing")
    parser.add_argument("--url", default="localhost:8080", help="gRPC server URL")
    parser.add_argument("--users", nargs="+", type=int, default=[10, 50, 100, 500, 1000], 
                       help="Number of concurrent users to test")
    
    args = parser.parse_args()
    
    print("🚀 Starting Simple gRPC Performance Tests")
    print(f"📍 Testing URL: {args.url}")
    print(f"👥 User counts: {args.users}")
    print()
    
    all_results = []
    
    with gRPCPerformanceTester(args.url) as tester:
        for num_users in args.users:
            print(f"Testing {num_users} users:")
            
            # Test voting (write-heavy)
            write_results = tester.test_write_heavy_scenario(num_users)
            write_results["scenario"] = "voting"
            tester.print_results(write_results)
            all_results.append(write_results)
            
            # Test results (read-heavy)
            read_results = tester.test_read_heavy_scenario(num_users)
            read_results["scenario"] = "results"
            tester.print_results(read_results)
            all_results.append(read_results)
            
            print()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"grpc_performance_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    
    print(f"💾 Results saved to: {results_file}")
    
    # Generate simple summary table for Report.md
    print(f"\n📊 Results for Report.md:")
    print("| Total Users | Scenario | Avg Latency (ms) | Throughput (req/s) |")
    print("|-------------|----------|------------------|-------------------|")
    
    for result in all_results:
        scenario = "Voting" if result['scenario'] == 'voting' else "Results"
        latency_ms = result['avg_latency'] * 1000
        throughput = result['throughput']
        print(f"| {result['num_users']:<11} | {scenario:<8} | {latency_ms:<16.2f} | {throughput:<17.2f} |")

if __name__ == "__main__":
    run_performance_tests()
