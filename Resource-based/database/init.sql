-- Database initialization script for polling system
-- This script will be run on both database shards
-- Note: The database name is set by the MYSQL_DATABASE environment variable

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
);

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id VARCHAR(255) PRIMARY KEY,
    creator_id VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    options JSON NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,
    INDEX idx_creator_id (creator_id),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id VARCHAR(255) PRIMARY KEY,
    poll_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    option_index INT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_poll_id (poll_id),
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    UNIQUE KEY unique_user_poll (user_id, poll_id),
    FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create a view for poll results
CREATE OR REPLACE VIEW poll_results AS
SELECT 
    p.id as poll_id,
    p.question,
    p.options,
    p.is_active,
    p.created_at,
    p.closed_at,
    COUNT(v.id) as total_votes
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.question, p.options, p.is_active, p.created_at, p.closed_at;

-- Insert some sample data for testing
INSERT IGNORE INTO users (id, name, email) VALUES
('user_sample_1', 'Alice Johnson', 'alice@example.com'),
('user_sample_2', 'Bob Smith', 'bob@example.com'),
('user_sample_3', 'Carol Davis', 'carol@example.com');

INSERT IGNORE INTO polls (id, creator_id, question, options, is_active) VALUES
('poll_sample_1', 'user_sample_1', 'What is your favorite programming language?', 
 JSON_ARRAY('JavaScript', 'Python', 'TypeScript', 'Go'), TRUE),
('poll_sample_2', 'user_sample_2', 'Which framework do you prefer for web development?', 
 JSON_ARRAY('React', 'Vue', 'Angular', 'Svelte'), TRUE);

INSERT IGNORE INTO votes (id, poll_id, user_id, option_index) VALUES
('vote_sample_1', 'poll_sample_1', 'user_sample_2', 0),
('vote_sample_2', 'poll_sample_1', 'user_sample_3', 1),
('vote_sample_3', 'poll_sample_2', 'user_sample_1', 0),
('vote_sample_4', 'poll_sample_2', 'user_sample_3', 0);

-- Show the created tables
SHOW TABLES;

-- Display sample data
SELECT 'Users:' as info;
SELECT * FROM users;

SELECT 'Polls:' as info;
SELECT * FROM polls;

SELECT 'Votes:' as info;
SELECT * FROM votes;

SELECT 'Poll Results:' as info;
SELECT * FROM poll_results;
