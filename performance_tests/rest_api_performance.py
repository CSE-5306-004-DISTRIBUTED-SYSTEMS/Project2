#!/usr/bin/env python3
"""
Simple Performance Testing Script for REST API
Tests latency and throughput for voting and results scenarios
"""

import asyncio
import aiohttp
import time
import json
import statistics
import argparse
from datetime import datetime
from typing import List, Dict, Tuple
import sys
import os
import random

class RESTPerformanceTester:
    def __init__(self, base_url: str = "http://localhost:3005"):
        self.base_url = base_url
        self.session = None
        self.test_poll_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_test_poll(self) -> int:
        """Create a test poll for performance testing"""
        poll_data = {
            "question": "Performance Test Poll - What is your favorite programming language?",
            "options": ["Python", "JavaScript", "TypeScript", "Go", "Rust", "Java", "C++", "C#"]
        }
        
        start_time = time.time()
        async with self.session.post(f"{self.base_url}/polls", json=poll_data) as response:
            end_time = time.time()
            
            if response.status == 201:
                result = await response.json()
                self.test_poll_id = result["id"]
                print(f"✅ Test poll created with ID: {self.test_poll_id}")
                return result["id"]
            else:
                error_text = await response.text()
                raise Exception(f"Failed to create test poll: {response.status} - {error_text}")
    
    async def cast_vote(self, option_index: int) -> Tuple[float, bool]:
        """Cast a single vote and return latency and success status"""
        vote_data = {"optionIndex": option_index}
        
        start_time = time.time()
        try:
            async with self.session.post(
                f"{self.base_url}/polls/{self.test_poll_id}/votes", 
                json=vote_data
            ) as response:
                end_time = time.time()
                latency = end_time - start_time
                
                if response.status == 201:
                    return latency, True
                else:
                    return latency, False
        except Exception as e:
            end_time = time.time()
            return end_time - start_time, False
    
    async def get_poll_results(self) -> Tuple[float, bool]:
        """Get poll results and return latency and success status"""
        start_time = time.time()
        try:
            async with self.session.get(f"{self.base_url}/polls/{self.test_poll_id}/results") as response:
                end_time = time.time()
                latency = end_time - start_time
                
                if response.status == 200:
                    return latency, True
                else:
                    return latency, False
        except Exception as e:
            end_time = time.time()
            return end_time - start_time, False
    
    async def test_write_heavy_scenario(self, num_users: int) -> Dict:
        """Test write-heavy scenario (voting) - measures latency and throughput"""
        print(f"Testing {num_users} concurrent votes...")
        
        # Create test poll
        await self.create_test_poll()
        
        # Generate random option indices for each user
        option_indices = [random.randint(0, 7) for _ in range(num_users)]
        
        # Execute concurrent votes
        start_time = time.time()
        tasks = [self.cast_vote(option_indices[i]) for i in range(num_users)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # Process results - focus on latency and throughput only
        latencies = []
        successful_requests = 0
        
        for result in results:
            if not isinstance(result, Exception):
                latency, success = result
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
    
    async def test_read_heavy_scenario(self, num_users: int) -> Dict:
        """Test read-heavy scenario (getting results) - measures latency and throughput"""
        print(f"Testing {num_users} concurrent result requests...")
        
        # Ensure we have a test poll with some votes
        if not self.test_poll_id:
            await self.create_test_poll()
            # Add some initial votes
            for _ in range(10):
                await self.cast_vote(0)
        
        # Execute concurrent result requests
        start_time = time.time()
        tasks = [self.get_poll_results() for _ in range(num_users)]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        end_time = time.time()
        
        # Process results - focus on latency and throughput only
        latencies = []
        successful_requests = 0
        
        for result in results:
            if not isinstance(result, Exception):
                latency, success = result
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

async def run_performance_tests():
    """Run simple performance tests focusing on latency and throughput"""
    parser = argparse.ArgumentParser(description="Simple REST API Performance Testing")
    parser.add_argument("--url", default="http://localhost:3005", help="Base URL for the API")
    parser.add_argument("--users", nargs="+", type=int, default=[10, 50, 100, 500, 1000], 
                       help="Number of concurrent users to test")
    
    args = parser.parse_args()
    
    print("🚀 Starting Simple REST API Performance Tests")
    print(f"📍 Testing URL: {args.url}")
    print(f"👥 User counts: {args.users}")
    print()
    
    all_results = []
    
    async with RESTPerformanceTester(args.url) as tester:
        for num_users in args.users:
            print(f"Testing {num_users} users:")
            
            # Test voting (write-heavy)
            write_results = await tester.test_write_heavy_scenario(num_users)
            write_results["scenario"] = "voting"
            tester.print_results(write_results)
            all_results.append(write_results)
            
            # Test results (read-heavy)
            read_results = await tester.test_read_heavy_scenario(num_users)
            read_results["scenario"] = "results"
            tester.print_results(read_results)
            all_results.append(read_results)
            
            print()
    
    # Save results to file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"performance_results_{timestamp}.json"
    
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
    asyncio.run(run_performance_tests())
