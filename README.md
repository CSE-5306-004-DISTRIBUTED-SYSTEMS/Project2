# Project2
Project Assignment 2: Building Your Own Distributed System  
2258-CSE-5306-004  
Name:  
- John Song - 1002306479
- Adam Emerson - 1000773509


## Simple Distributed Polling/Voting System  
This system allows users to create polls and vote, with the results being aggregated across the distributed nodes.  
This system is designed to allow for the creation and management of polls across multiple, distributed nodes. It focuses on reliability and real-time result aggregation

#### Five Functional Requirements
- Create Poll: A user can create a new poll with a question and a set of options.
- Cast Vote: A user can vote for an option on a specific poll.
- Get Poll Results: A user can view the current vote counts for a specific poll.
- List All Polls: A user can see a list of all available polls.
- Close Poll: The creator of a poll can close it to prevent further voting.

#### Database Design 
##### Poll Table
|uuid|poll_questions|options|status|create_at_time|
|--|--|--|--|--|
1|text|text[]| open/close|timestamp|

##### Vote Table

|userID|select_options|vote_time| uuid|
|--|--|--|--|
1|text|timestamp| froeign key|



## Designs 2 Patterns 

### 1. Resource Based Architecture w/ HTTP (REST API)

The distributed polling/voting system is designed around a **RESTful API** with clear, resource-based endpoints.

#### **API Endpoints**

**Users**

* `POST /users` → Create a user
* `GET /users/{userId}` → Get user details
* `GET /users/{userId}/polls` → List polls created by this user
* `GET /users/{userId}/votes` → List votes cast by this user

**Polls**

* `POST /polls` → Create a new poll
* `GET /polls` → List all polls
* `GET /polls/{pollId}` → Get details for a specific poll
* `PUT /polls/{pollId}/close` → Close a poll (creator only)

**Votes**

* `POST /polls/{pollId}/votes` → Cast a vote on a poll
* `GET /polls/{pollId}/results` → Get current results for a poll

#### **System Components**

* **Frontend**: A lightweight **React application** for creating polls, casting votes, and viewing results.
* **API Layer**: A **Hono-based service** packaged in a Docker container, exposing the REST endpoints.
* **Middleware Layer**: A routing component that determines which database a given poll belongs to (supporting **horizontal scaling / sharding**).
* **Databases**: Two relational database containers (**MariaDB or SQL**), each storing a partition of polls and their associated votes.

#### **Deployment**

* **API Container** communicates with the **middleware**, which directs queries to the correct database container.
* The databases maintain persistent storage for users, polls, and votes.
* The **frontend React app** interacts only with the REST API, keeping the client simple and decoupled.

---

#### 2. Microservice gRPC 

There are 5 nodes for this distributed systems.  
- Entry Point (Load Balancers)
- Application Logic 
- Data Store


**Nodes 1**: **Load Balancers**: These two nodes will be set up in a active-passive configuration. They are the single entry point for all client traffic. They distribute requests to the two servers. If one load balancer fails, the other can seamlessly take over. This prevents a single point of failure at the network edge.

**Nodes 2 & 3**: **Application Logic**: These two nodes will act as your application servers. Each node will run logics (Polls, Voting, Results). This creates redundancy and load distribution. If one of these servers fails, the other can continue to process all requests.

**Node 4 & 5**: **Database Server**: Application nodes (Nodes 1 and 2) will connect to this database to read and write data for storing voting, polling, and result table.

#### Technology Stacks
- Nginx 
- Python 
- gRPC
- PostgreSQL  

#### Quick Run  

##### pull images 
- `docker pull johncxsong/primary-database-node4` 
- `docker pull johncxsong/replica-database-node5`
- `docker pull johncxsong/backup-server-node3`
- `docker pull johncxsong/primary-server-node2`
- `docker pull johncxsong/load-balance-node1`

##### Run. 
1. `docker network create voting-net`
2. `docker run --name db-primary \
  --network voting-net \
  -p 5432:5432 \
  johncxsong/primary-database-node4`

3. `docker run --name db-replica \
  --network voting-net \
  --link db-primary:db-primary \
  johncxsong/replica-database-node5`

4. `docker run --network voting-net --name primary -p 50051:50051 johncxsong/primary-server-node2`

5. `docker run --network voting-net --name backup -p 50052:50052 johncxsong/backup-server-node3`

6. `docker run --network voting-net --name loader -p 8080:8080 johncxsong/load-balance-node1`

7. `pip install -r ./app/requirement.txt`

8. `python test_client.py`  create a poll 

9. `python test.py` copy UUID for voting


