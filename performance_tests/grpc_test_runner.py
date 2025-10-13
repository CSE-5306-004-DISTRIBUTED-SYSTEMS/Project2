#!/usr/bin/env python3
"""
Simple Performance Test Runner for gRPC Microservice
Generates results for the Report.md evaluation section
"""

import subprocess
import sys
import json
import time
from datetime import datetime

def run_grpc_tests():
    """Run gRPC performance tests and generate results"""
    print("🚀 Starting Simple gRPC Performance Tests")
    print("=" * 50)
    
    # Test user counts from the Report.md table
    user_counts = [10, 50, 100, 500, 1000]
    
    print("📋 Running tests for user counts:", user_counts)
    print("⏱️  This will take a few minutes...")
    print()
    
    # Run the performance test
    try:
        result = subprocess.run([
            sys.executable, "grpc_performance.py",
            "--users"] + [str(count) for count in user_counts],
            capture_output=True,
            text=True,
            cwd="."
        )
        
        if result.returncode == 0:
            print("✅ Tests completed successfully!")
            print("\n" + result.stdout)
            
            # Find the generated results file
            import glob
            result_files = glob.glob("grpc_performance_results_*.json")
            if result_files:
                latest_file = max(result_files)
                print(f"\n📊 Results saved to: {latest_file}")
                
                print("\n💡 Copy the table above into your Report.md!")
                
        else:
            print("❌ Tests failed!")
            print("Error:", result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Error running tests: {e}")
        return False
    
    return True

def check_requirements():
    """Check if required packages are available"""
    try:
        import grpc
        print("✅ grpcio is available")
    except ImportError:
        print("❌ grpcio not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "grpcio"])
    
    # Check if protobuf files exist
    import os
    proto_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'microservice_rpc', 'app')
    if not os.path.exists(os.path.join(proto_path, 'polling_pb2.py')):
        print("❌ Protobuf files not found. Please ensure the gRPC microservice is set up correctly.")
        print(f"Expected files in: {proto_path}")
        return False
    
    print("✅ All requirements satisfied")
    return True

if __name__ == "__main__":
    print("🧪 gRPC Performance Test Runner")
    print("=" * 40)
    
    # Check requirements
    if not check_requirements():
        sys.exit(1)
    
    # Run tests
    success = run_grpc_tests()
    
    if success:
        print("\n🎉 All tests completed! Check the generated JSON file for detailed results.")
    else:
        print("\n💥 Tests failed. Please check the error messages above.")
        sys.exit(1)
