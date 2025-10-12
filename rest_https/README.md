# Distributed Polling System

A modern polling/voting web application built with React frontend and REST API backend, featuring database sharding for scalability.

## 🏗️ Simple Architecture

This system consists of 5 nodes. A Frontend (React Application), a loadbalancer (NGINX), 2 API Instances (Hono), and a database (Postgres).

**What each part does:**

- **Frontend**: User interface for creating polls and voting (React + TypeScript + Tailwind CSS)
- **Loadbalancer**: Routes interactions from Frontend to an API instance. Currently set to split traffic between them evenly.
- **API**: REST Based architecture that allows for the opening and closing polls, voting, and seeing results.

- **Database**: A postgres database instance which stores the polls and results.

## 🚀 How to Start the Application

### What You Need

- Docker and Docker Compose installed on your computer

### Start Everything

1. **Open terminal and go to the project folder:**

   ```bash
   cd rest_https
   ```

2. **Start all services:**

   ```bash
   docker-compose up --build
   ```

3. **Wait for everything to start** (this may take a few minutes the first time)

## 🌐 How to Access the Frontend

Once everything is running, open your web browser and go to:

**http://localhost:3002**

This is where you can:

- Create user accounts
- Create polls with multiple options
- Vote on existing polls
- View real-time poll results
- Close polls (if you're the creator)

The application will automatically connect to the backend services running on the other ports.
