# Project2
Project Assignment 2: Building Your Own Distributed System  
2258-CSE-5306-004  
Name:  
- John Song (ID)
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

#### 2. Client-server gRPC
