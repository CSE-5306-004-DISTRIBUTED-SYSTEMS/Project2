# Project2
Project Assignment 2: Building Your Own Distributed System  
2258-CSE-5306-004  
Name:  
- John Song (ID)
- Adam Emerson (ID)


## Simple Distributed Polling/Voting System  
This system allows users to create polls and vote, with the results being aggregated across the distributed nodes.  
This system is designed to allow for the creation and management of polls across multiple, distributed nodes. It focuses on reliability and real-time result aggregation

#### Five Functional Requirements
- Create Poll: A user can create a new poll with a question and a set of options.
- Cast Vote: A user can vote for an option on a specific poll.
- Get Poll Results: A user can view the current vote counts for a specific poll.
- List All Polls: A user can see a list of all available polls.
- Close Poll: The creator of a poll can close it to prevent further voting.


## Designs 2 patterns 

#### 1. resources-based HTTP



#### 2. Client-server gRPC
