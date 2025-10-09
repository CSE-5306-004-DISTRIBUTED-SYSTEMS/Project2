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




### 1.2 Microservice gRPC 




## 2. Evaluation  
Perofrmance (latency, throughput) & Scalability. 

### 2.1 Experiement (write-heavy scalability) - Voting
- Many users vote at the same time. 

$Latency = T_{response} - T_{request}$. 


$Throughput = \frac{Total \space Requests}{Latency} $

|Total Users Request| Latency (round-trip time) | Throughput|
|--|--|--|
10| | |
50| | |
100| | |
500| | |
1000| | |


### 2.2 Experiement (read-heavy scalability) - Show results  

- Many users get the result at the same time. 

|Total Users Request| Latency (round-trip time) | Throughput|
|--|--|--|
10| | |
50| | |
100| | |
500| | |
1000| | |


## 3. Analysis Between Communicaton and Structure.

### 3.1 Communications (HTTP vs. gRPC)  


### 3.2 Structures (Resources vs. microservices)






