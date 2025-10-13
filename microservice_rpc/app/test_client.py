import grpc
import polling_pb2
import polling_pb2_grpc

def run_test():
    with grpc.insecure_channel('localhost:8080') as channel:
        ## create client stub for service 
        poll_stub = polling_pb2_grpc.PollServiceStub(channel)
        vote_stub = polling_pb2_grpc.VoteServiceStub(channel)
        result_stub = polling_pb2_grpc.ResultServiceStub(channel)


        # # --- 1. create a poll ----
        print("----1. creating a new poll----")
        create_request = polling_pb2.CreatePollRequest(
            poll_questions = "What is your favorite animals?",
            options = ["dog","cat","bird","spider"]
        )

        create_poll = poll_stub.CreatePoll(create_request)

        poll_id = create_poll.uuid
        print(f"Poll created successfully with ID: {poll_id}\n")

        # --2. List all polls ---- 
        print("---2. Listing all polls---")
        list_response = poll_stub.ListPolls(polling_pb2.Empty())
        print("current polls on the server:\n")

        for poll in list_response.polls:
            print(f"-ID: {poll.uuid}, Question: {poll.poll_questions}, Status: {poll.status}\n")

<<<<<<< HEAD
<<<<<<< HEAD
        # # # --- 3. Cast a Vote --- 
        # print("------3. Caste Vote------")
        # vote_request = polling_pb2.CastVoteRequest(
        #     uuid="c905c351-6129-4f05-970e-0d96498adc30",
        #     userID = "John-Song4",
        #     select_options="dog"
        # )
        # vote_response = vote_stub.CastVote(vote_request)
        # print(f"Vote cast status: {vote_response.status}\n")
=======
=======
>>>>>>> main
        # --- 3. Cast a Vote --- 
        print("------3. Caste Vote------")
        vote_request = polling_pb2.CastVoteRequest(
            uuid="c28ef63-95a0-4f6e-8048-48347c928d88",
            userID = "John-Song4",
            select_options="dog"
        )
        vote_response = vote_stub.CastVote(vote_request)
        print(f"Vote cast status: {vote_response.status}\n")
<<<<<<< HEAD
>>>>>>> main
=======
>>>>>>> main


        # #------ 4. Get Poll Results ---------- 
        # print("--- 4. Getting poll results ---")
        # result_request = polling_pb2.PollRequest(uuid = "c905c351-6129-4f05-970e-0d96498adc30")
        # result_response = result_stub.GetPollResults(result_request)
        # print(f"Results for poll {result_response.uuid} --'{result_response.poll_questions}':")
        # for option, count in result_response.results.items():
        #     print(f"- {option}: {count} votes")
        # # print("")

        # #------- 5. Close the Poll ---------
        #         # --- 5. Close the Poll ---
        # print("--- 5. Closing the poll ---")
        # close_request = polling_pb2.PollRequest(uuid="c905c351-6129-4f05-970e-0d96498adc30")
        # closed_poll = poll_stub.ClosePoll(close_request)
        # print(f"Poll status is now: {closed_poll.poll_questions} -- {closed_poll.status}\n")



if __name__ == '__main__':
    run_test()