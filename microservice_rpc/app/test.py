import grpc
import polling_pb2
import polling_pb2_grpc
import threading
import time
from statistics import mean

# gRPC connection target (through Nginx)
GRPC_TARGET = "localhost:8080"

# Test configuration
TEST_UUID = "cdcf8b15-8aac-4bb7-af62-03ee0d5588ef"  # replace with existing poll uuid
USER_COUNTS = [10, 50, 100, 500, 1000]


def vote_once(user_id):
    """Each user casts a vote once and returns latency (seconds)."""
    start = time.time()
    try:
        with grpc.insecure_channel(GRPC_TARGET) as channel:
            vote_stub = polling_pb2_grpc.VoteServiceStub(channel)
            vote_request = polling_pb2.CastVoteRequest(
                uuid=TEST_UUID,
                userID=f"User-{user_id}",
                select_options="dog",
            )
            vote_stub.CastVote(vote_request)
    except grpc.RpcError as e:
        print(f"Vote failed for user {user_id}: {e}")
    end = time.time()
    return end - start


def get_result_once(user_id):
    """Each user fetches the result once and returns latency (seconds)."""
    start = time.time()
    try:
        with grpc.insecure_channel(GRPC_TARGET) as channel:
            result_stub = polling_pb2_grpc.ResultServiceStub(channel)
            result_request = polling_pb2.PollRequest(uuid=TEST_UUID)
            result_stub.GetPollResults(result_request)
    except grpc.RpcError as e:
        print(f"Result request failed for user {user_id}: {e}")
    end = time.time()
    return end - start


def run_concurrent_test(task_fn, total_users):
    """Run a concurrent load test and return average latency and throughput."""
    latencies = []

    def worker(i):
        latency = task_fn(i)
        latencies.append(latency)

    start_time = time.time()
    threads = [threading.Thread(target=worker, args=(i,)) for i in range(total_users)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    end_time = time.time()

    total_time = end_time - start_time
    avg_latency = mean(latencies)
    throughput = total_users / total_time  # Requests per second
    return avg_latency, throughput


def main():
    print("\n--- Write-heavy Test (Voting) ---")
    print(f"{'Users':<10}{'Latency (s)':<20}{'Throughput (req/s)':<20}")
    for users in USER_COUNTS:
        latency, throughput = run_concurrent_test(vote_once, users)
        print(f"{users:<10}{latency:<20.4f}{throughput:<20.4f}")

    print("\n--- Read-heavy Test (Results) ---")
    print(f"{'Users':<10}{'Latency (s)':<20}{'Throughput (req/s)':<20}")
    for users in USER_COUNTS:
        latency, throughput = run_concurrent_test(get_result_once, users)
        print(f"{users:<10}{latency:<20.4f}{throughput:<20.4f}")


if __name__ == "__main__":
    main()
