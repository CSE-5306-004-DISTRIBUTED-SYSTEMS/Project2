#!/usr/bin/env python3
"""
Simple Performance Test Runner for REST API
Generates results for the Report.md evaluation section
"""

import subprocess
import sys
import json
import time
from datetime import datetime

def run_rest_tests():
    """Run REST API performance tests and generate results"""
    print("🚀 Starting Simple REST API Performance Tests")
    print("=" * 50)
    
    # Test user counts from the Report.md table
    user_counts = [10, 50, 100, 500, 1000]
    
    print("📋 Running tests for user counts:", user_counts)
    print("⏱️  This will take a few minutes...")
    print()
    
    # Run the performance test
    try:
        result = subprocess.run([
            sys.executable, "rest_api_performance.py",
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
            result_files = glob.glob("performance_results_*.json")
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
    """Check if required packages are installed"""
    try:
        import aiohttp
        print("✅ aiohttp is installed")
    except ImportError:
        print("❌ aiohttp not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "aiohttp"])
    
    print("✅ All requirements satisfied")

if __name__ == "__main__":
    print("🧪 REST API Performance Test Runner")
    print("=" * 40)
    
    # Check requirements
    check_requirements()
    
    # Run tests
    success = run_rest_tests()
    
    if success:
        print("\n🎉 All tests completed! Check the generated JSON file for detailed results.")
    else:
        print("\n💥 Tests failed. Please check the error messages above.")
        sys.exit(1)
