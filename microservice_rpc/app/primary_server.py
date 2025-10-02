
# packages
import grpc
import psycopg2  ## database
import os
from concurrent import futures


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

def db_connection():
    return psycopg2.connect(
            dbname = "pollsdb",
            user="postgres",
            password="postgres",
            host ="localhost",
            port =5432
        )



class PollServiceImpl(polling_pb2_grpc.PollServiceServicer):

    # create . list and close 
    






# def ListPolls():
#     conn = db_connection()
#     cur = conn.cursor()
#     cur.execute("SELECT * FROM poll ")
#     polls_data = cur.fetchall()
#     cur.close()
#     conn.close()

#     print(polls_data)


# ListPolls()


