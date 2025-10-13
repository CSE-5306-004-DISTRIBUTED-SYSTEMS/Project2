#!/usr/bin/env python3
"""
Performance Results Visualization Script
Generates 4 graphs comparing REST API vs gRPC performance
"""

import json
import matplotlib.pyplot as plt
import numpy as np
import glob
import os
from typing import Dict, List, Tuple

def load_performance_data() -> Tuple[List[Dict], List[Dict]]:
    """Load performance data from JSON files"""
    
    # Find the latest REST API results
    rest_files = glob.glob("performance_results_*.json")
    if not rest_files:
        raise FileNotFoundError("No REST API performance results found")
    latest_rest_file = max(rest_files)
    
    # Find the latest gRPC results
    grpc_files = glob.glob("grpc_performance_results_*.json")
    if not grpc_files:
        raise FileNotFoundError("No gRPC performance results found")
    latest_grpc_file = max(grpc_files)
    
    print(f"Loading REST API data from: {latest_rest_file}")
    print(f"Loading gRPC data from: {latest_grpc_file}")
    
    with open(latest_rest_file, 'r') as f:
        rest_data = json.load(f)
    
    with open(latest_grpc_file, 'r') as f:
        grpc_data = json.load(f)
    
    return rest_data, grpc_data

def extract_data_by_scenario(data: List[Dict], scenario: str) -> Tuple[List[int], List[float], List[float]]:
    """Extract user counts, latencies, and throughputs for a specific scenario"""
    users = []
    latencies = []
    throughputs = []
    
    for entry in data:
        if entry['scenario'] == scenario:
            users.append(entry['num_users'])
            latencies.append(entry['avg_latency'] * 1000)  # Convert to ms
            throughputs.append(entry['throughput'])
    
    # Sort by user count
    sorted_data = sorted(zip(users, latencies, throughputs))
    users, latencies, throughputs = zip(*sorted_data)
    
    return list(users), list(latencies), list(throughputs)

def create_graphs():
    """Create the 4 performance comparison graphs"""
    
    # Load data
    rest_data, grpc_data = load_performance_data()
    
    # Extract data for each scenario
    rest_voting_users, rest_voting_latency, rest_voting_throughput = extract_data_by_scenario(rest_data, 'voting')
    rest_results_users, rest_results_latency, rest_results_throughput = extract_data_by_scenario(rest_data, 'results')
    
    grpc_voting_users, grpc_voting_latency, grpc_voting_throughput = extract_data_by_scenario(grpc_data, 'voting')
    grpc_results_users, grpc_results_latency, grpc_results_throughput = extract_data_by_scenario(grpc_data, 'results')
    
    # Set up the plotting style
    plt.style.use('default')
    fig = plt.figure(figsize=(16, 12))
    
    # Colors for the lines
    rest_color = '#2E86AB'  # Blue for REST API
    grpc_color = '#A23B72'  # Purple for gRPC
    
    # 1. Results Scenario - Latency
    plt.subplot(2, 2, 1)
    plt.plot(rest_results_users, rest_results_latency, 'o-', color=rest_color, linewidth=2, 
             markersize=8, label='REST API (HTTPS)', markerfacecolor='white', markeredgewidth=2)
    plt.plot(grpc_results_users, grpc_results_latency, 's-', color=grpc_color, linewidth=2, 
             markersize=8, label='gRPC', markerfacecolor='white', markeredgewidth=2)
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Average Latency (ms)')
    plt.title('Results Scenario - Latency Comparison')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.yscale('log')
    
    # 2. Results Scenario - Throughput
    plt.subplot(2, 2, 2)
    plt.plot(rest_results_users, rest_results_throughput, 'o-', color=rest_color, linewidth=2, 
             markersize=8, label='REST API (HTTPS)', markerfacecolor='white', markeredgewidth=2)
    plt.plot(grpc_results_users, grpc_results_throughput, 's-', color=grpc_color, linewidth=2, 
             markersize=8, label='gRPC', markerfacecolor='white', markeredgewidth=2)
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Throughput (requests/second)')
    plt.title('Results Scenario - Throughput Comparison')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 3. Voting Scenario - Latency
    plt.subplot(2, 2, 3)
    plt.plot(rest_voting_users, rest_voting_latency, 'o-', color=rest_color, linewidth=2, 
             markersize=8, label='REST API (HTTPS)', markerfacecolor='white', markeredgewidth=2)
    plt.plot(grpc_voting_users, grpc_voting_latency, 's-', color=grpc_color, linewidth=2, 
             markersize=8, label='gRPC', markerfacecolor='white', markeredgewidth=2)
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Average Latency (ms)')
    plt.title('Voting Scenario - Latency Comparison')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.yscale('log')
    
    # 4. Voting Scenario - Throughput
    plt.subplot(2, 2, 4)
    plt.plot(rest_voting_users, rest_voting_throughput, 'o-', color=rest_color, linewidth=2, 
             markersize=8, label='REST API (HTTPS)', markerfacecolor='white', markeredgewidth=2)
    plt.plot(grpc_voting_users, grpc_voting_throughput, 's-', color=grpc_color, linewidth=2, 
             markersize=8, label='gRPC', markerfacecolor='white', markeredgewidth=2)
    plt.xlabel('Number of Concurrent Users')
    plt.ylabel('Throughput (requests/second)')
    plt.title('Voting Scenario - Throughput Comparison')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Adjust layout and save
    plt.tight_layout()
    
    # Save the graph
    output_file = 'performance_comparison_graphs.png'
    plt.savefig(output_file, dpi=300, bbox_inches='tight')
    print(f"📊 Graphs saved as: {output_file}")
    
    # Also save as PDF for better quality
    pdf_file = 'performance_comparison_graphs.pdf'
    plt.savefig(pdf_file, bbox_inches='tight')
    print(f"📊 High-quality PDF saved as: {pdf_file}")
    
    # Show the graph
    plt.show()
    
    # Print summary statistics
    print("\n📈 Performance Summary:")
    print("=" * 50)
    
    # Results scenario summary
    print("\n🔍 Results Scenario:")
    print(f"REST API - Best latency: {min(rest_results_latency):.2f}ms, Best throughput: {max(rest_results_throughput):.1f} req/s")
    print(f"gRPC     - Best latency: {min(grpc_results_latency):.2f}ms, Best throughput: {max(grpc_results_throughput):.1f} req/s")
    
    # Voting scenario summary
    print("\n🗳️  Voting Scenario:")
    print(f"REST API - Best latency: {min(rest_voting_latency):.2f}ms, Best throughput: {max(rest_voting_throughput):.1f} req/s")
    print(f"gRPC     - Best latency: {min(grpc_voting_latency):.2f}ms, Best throughput: {max(grpc_voting_throughput):.1f} req/s")

def check_dependencies():
    """Check if required packages are installed"""
    try:
        import matplotlib.pyplot as plt
        import numpy as np
        print("✅ matplotlib and numpy are available")
        return True
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Please install required packages:")
        print("pip install matplotlib numpy")
        return False

if __name__ == "__main__":
    print("📊 Performance Results Visualization")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        exit(1)
    
    # Check if we're in the right directory
    if not os.path.exists("performance_results_") and not glob.glob("performance_results_*.json"):
        print("❌ No performance results found in current directory")
        print("Please run this script from the performance_tests directory")
        exit(1)
    
    try:
        create_graphs()
        print("\n🎉 Graphs generated successfully!")
    except Exception as e:
        print(f"❌ Error generating graphs: {e}")
        exit(1)
