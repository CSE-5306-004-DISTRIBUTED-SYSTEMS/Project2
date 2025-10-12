
# packages
from concurrent import futures

import grpc
import psycopg2  ## database
import os



## gRPC function
import polling_pb2
import polling_pb2_grpc


def test_connection():
    try:
        print('Connecting to the PostgreSQL database...')
        connection = psycopg2.connect(
            dbname = "pollsdb",
            user="postgres",
            password="postgres",
            host ="localhost",
            port =5432
        )
        cursor = connection.cursor()
        # execute a statement
        print('PostgreSQL database version:')
        cursor.execute('SELECT version()')
        db_version = cursor.fetchone()
        print(db_version)

    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")

    finally:
        # Close the cursor and connection in a finally block to ensure cleanup
        if cursor:
            cursor.close()
        if connection:
            connection.close()
            print("PostgreSQL connection closed.")


def get_db_connection():
    return psycopg2.connect(
            dbname = "pollsdb",
            user="postgres",
            password="postgres",
            host ="db-primary",
            port =5432
        )



class PollServiceImpl(polling_pb2_grpc.PollServiceServicer):

    # create . list and close
    def CreatePoll(self, request, context):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO poll (poll_questions, options) VALUES (%s, %s) RETURNING uuid, poll_questions, options, status, create_at_time",
            (request.poll_questions, list(request.options)), ## maybe list(options)
        )
        i = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return polling_pb2.PollResponse(uuid=str(i[0]), poll_questions=i[1], options=i[2], status=i[3], create_at_time=str(i[4]))

    ## listpoll 
    def ListPolls(self, request, context):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT uuid, poll_questions, options, status, create_at_time FROM poll ORDER BY create_at_time DESC"
        )
        polls_data = cur.fetchall()
        cur.close()
        conn.close()
        polls_list = [polling_pb2.PollResponse(uuid=str(r[0]),poll_questions=r[1],options=r[2], status=r[3]) for r in polls_data]

        return polling_pb2.ListPollsResponse(polls=polls_list) ## must polls = poll_list

    ## close poll 
    def ClosePoll(self, request, context):
        with get_db_connection() as conn:
            cur = conn.cursor()
            cur.execute(
                "UPDATE poll SET status = 'close' WHERE uuid=%s RETURNING uuid, poll_questions, options, status, create_at_time",
                (request.uuid,))
            data = cur.fetchone()
            if data is None:
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details("poll not found")
                return polling_pb2.PollResponse()
        return polling_pb2.PollResponse(
            uuid=str(data[0]),
            poll_questions = data[1],
            options=data[2],
            status=data[3],
            create_at_time=str(data[4]),
        )

class VoteServiceImpl(polling_pb2_grpc.VoteServiceServicer):
    ## implements for voting 

    def CastVote(self, request, context):
        ## connect to vote 
        with get_db_connection() as conn: 
            cur = conn.cursor()
            cur.execute("SELECT status, options FROM poll WHERE uuid=%s",
                        (request.uuid,)) ## add ,  to let driver recongize tuple. 
            data = cur.fetchone()
            if data is None:
                return polling_pb2.VoteResponse(status="Poll Not Found")
            status, options = data
            if status != 'open':
                return polling_pb2.VoteResponse(status="Poll Closed")
            if request.select_options not in options:
                return polling_pb2.VoteResponse(status="Invalid Option")
            ## vote
            try:
                cur.execute(
                    "INSERT INTO vote (userID, select_options, uuid) VALUES (%s,%s,%s)",
                    (request.userID, request.select_options, request.uuid),
                )
            except Exception as e:
                ## assume duplicate error 
                conn.rollback()
                if isinstance(e, psycopg2.errors.UniqueViolation):
                    return polling_pb2.VoteResponse(status="duplicate_vote")
                raise
        return polling_pb2.VoteResponse(status="Vote Successfully!")

## getting result for poll
class ResultServiceImpl(polling_pb2_grpc.ResultServiceServicer):
    ## implementation 
    def GetPollResults(self, request, context):
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT poll_questions, options FROM poll WHERE uuid=%s",
                    (request.uuid,))
        data = cur.fetchone()
        if not data:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details("Poll not found")
            return polling_pb2.PollResultResponse()
        question, options = data
        results = {option: 0 for option in options}
        cur.execute("SELECT select_options, COUNT(*) FROM vote WHERE uuid = %s GROUP BY select_options",
                    (request.uuid,))
        vote_counts = cur.fetchall()
        for option, count in vote_counts:
            if option in results:
                results[option] = count

        cur.close()
        conn.close()
        return polling_pb2.PollResultResponse(uuid=request.uuid, poll_questions= question, results=results)




def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    polling_pb2_grpc.add_PollServiceServicer_to_server(PollServiceImpl(), server)
    polling_pb2_grpc.add_VoteServiceServicer_to_server(VoteServiceImpl(), server)
    polling_pb2_grpc.add_ResultServiceServicer_to_server(ResultServiceImpl(), server)

    server.add_insecure_port('[::]:50052')
    server.start()

    print("gRPC Voting Backup server started on port 50052.")

    server.wait_for_termination()


if __name__ == '__main__':
    # test_connection()
    serve()

# port = os.environ.get("GRPC_PORT", "50051") # Default to 50051 if not set
# server.add_insecure_port(f'[::]:{port}')
# print(f"gRPC server started on port {port}.")





# def ListPolls():
#     conn = db_connection()
#     cur = conn.cursor()
#     cur.execute("SELECT * FROM poll ")
#     polls_data = cur.fetchall()
#     cur.close()
#     conn.close()

#     print(polls_data)


# ListPolls()


