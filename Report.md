# Project Assignment 2 Report

2258-CSE-5306-004  
Name:

- John Song - 10023064679
- Adam Emerson - 1000773509

Github: [https://github.com/CSE-5306-004-DISTRIBUTED-SYSTEMS/Project2.git](https://github.com/CSE-5306-004-DISTRIBUTED-SYSTEMS/Project2.git)

## 1. System Overview

This system allows users to create polls and vote, with the results being aggregated across the distributed nodes.  
This system is designed to allow for the creation and management of polls across multiple, distributed nodes. It focuses on reliability and real-time result aggregation

#### Five Functional Requirements

- Create Poll: A user can create a new poll with a question and a set of options.
- Cast Vote: A user can vote for an option on a specific poll.
- Get Poll Results: A user can view the current vote counts for a specific poll.
- List All Polls: A user can see a list of all available polls.
- Close Poll: The creator of a poll can close it to prevent further voting.

## System Designs

### 2.1 Resource Based Architecture w/ HTTP (REST API)

The REST-based architecture implements a distributed polling system using HTTP communication and a resource-oriented design. The system consists of 5 containerized nodes:

**System Components:**

- **Frontend (React)**: User interface built with TypeScript and Tailwind CSS, running on port 3002
- **Load Balancer (NGINX)**: Distributes incoming requests evenly between API instances on port 3005
- **API Instances (2x Hono)**: REST-based microservices handling business logic on internal port 3000
- **Database (PostgreSQL)**: Single database instance storing all poll data on port 5432

**Communication Model:** HTTP/REST with JSON payloads

- Client-server communication via standard HTTP methods (GET, POST, PUT)
- Stateless request-response pattern
- JSON serialization for data exchange
- Load balancing for horizontal scaling

**How it supports the five functional requirements:**

1. **Create Poll**: `POST /polls` endpoint with poll metadata in JSON format
2. **Cast Vote**: `POST /polls/{id}/votes` endpoint with vote data
3. **Get Poll Results**: `GET /polls/{id}/results` endpoint returning aggregated counts
4. **List All Polls**: `GET /polls` endpoint returning all available polls
5. **Close Poll**: `PUT /polls/{id}/close` endpoint for poll creators

**Architecture Benefits:**

- Simple HTTP-based communication with wide tooling support
- Horizontal scalability through load balancing
- Stateless design enabling easy scaling
- Standard REST conventions for predictable API design

### 2.2 Microservice gRPC

## 3. Evaluation

Perofrmance (latency, throughput) & Scalability.

### 3.0 Hardware

PC: Macbook air (my machine?) / your machine

### 3.1 Experiement (write-heavy scalability) - Voting

- Many users vote at the same time.

$Latency = T_{response} - T_{request}$.

$Throughput = \frac{Total \space Requests}{Latency} $

#### REST HTTPS Evaluation

| Total Users | Scenario | Avg Latency (ms) | Throughput (req/s) |
| ----------- | -------- | ---------------- | ------------------ |
| 10          | Voting   | 30.01            | 249.60             |
| 50          | Voting   | 26.36            | 1175.28            |
| 100         | Voting   | 34.45            | 1615.69            |
| 500         | Voting   | 140.42           | 1895.35            |
| 1000        | Voting   | 225.59           | 2357.78            |

### 3.2 Experiement (read-heavy scalability) - Showing poll results

- Many users get the result at the same time.

#### REST HTTPS Evaluation

| Total Users | Scenario | Avg Latency (ms) | Throughput (req/s) |
| ----------- | -------- | ---------------- | ------------------ |
| 10          | Results  | 5.83             | 650.32             |
| 50          | Results  | 13.20            | 1919.89            |
| 100         | Results  | 18.87            | 2751.93            |
| 500         | Results  | 78.59            | 2866.68            |
| 1000        | Results  | 109.58           | 4043.72            |

## 4. Analysis Between Communicaton and Structure.

### 4.1 Communications (HTTP vs. gRPC)

### 4.2 Structures (Resources vs. microservices)

## 5. AI Usage

### 5.1 REST HTTPS Based Architecture

To develop the REST HTTPS Based architecture we made liberal use of AI through a coding agent, Cursor. Using pre-existing domain knowledge, we sketched out a system plan that outlined a general architecture, libraries we wanted to use, and the general project requirements. This outline was provided to the LLM and formalized into a more comprehensive plan of action.

From there, a pair-programming paradigm was adopted, where we would request the LLM to make changes to the code base, and then we would review the changes and approve, edit, or deny them and implement things manually.

Initially the AI agent tended to over-engineer and add features that were not requested or were beyond the scope of the assignment. Manual refactoring was done to simplify the codebase and we updated our prompting strategy to ensure the model produced simple output suitable for this class project.

The evaluation scripts were generated by the coding agent as well.

### 5.2 RPC Microservice Architecture

## 6. Distribution of Workload

We collaborated initially on coming up with different system designs suitable for the project. Once two concepts were decided on, we worked largely indepedently. Adam developed the REST architecture and John took on the Microservice architecture. Finally, we merged our changes into the git repository and worked together on the evaluation section and the report.
