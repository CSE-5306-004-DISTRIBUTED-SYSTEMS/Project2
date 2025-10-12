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

### 1.1 Resource Based Architecture w/ HTTP (REST API)

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

### 1.2 Microservice gRPC

## 2. Evaluation

Perofrmance (latency, throughput) & Scalability.

### 2.0 Hardware

PC: Macbook air (my machine?) / your machine

### 2.1 Experiement (write-heavy scalability) - Voting

- Many users vote at the same time.

$Latency = T_{response} - T_{request}$.

$Throughput = \frac{Total \space Requests}{Latency} $

| Total Users Request | Latency (round-trip time) | Throughput |
| ------------------- | ------------------------- | ---------- |
| 10                  |                           |            |
| 50                  |                           |            |
| 100                 |                           |            |
| 500                 |                           |            |
| 1000                |                           |            |

### 2.2 Experiement (read-heavy scalability) - Show results

- Many users get the result at the same time.

| Total Users Request | Latency (round-trip time) | Throughput |
| ------------------- | ------------------------- | ---------- |
| 10                  |                           |            |
| 50                  |                           |            |
| 100                 |                           |            |
| 500                 |                           |            |
| 1000                |                           |            |

## 3. Analysis Between Communicaton and Structure.

### 3.1 Communications (HTTP vs. gRPC)

### 3.2 Structures (Resources vs. microservices)
