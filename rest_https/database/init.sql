-- Initialize PostgreSQL database for distributed polling system

-- Create polls table
CREATE TABLE IF NOT EXISTS polls (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_polls_active ON polls(is_active);
CREATE INDEX IF NOT EXISTS idx_polls_created_at ON polls(created_at);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_option_index ON votes(option_index);

-- Insert sample data for testing
INSERT INTO polls (question, options, is_active) VALUES
    ('What is your favorite programming language?', 
     '["JavaScript", "Python", "TypeScript", "Go", "Rust"]', 
     true),
    ('Which framework do you prefer for web development?', 
     '["React", "Vue", "Angular", "Svelte"]', 
     true),
    ('What is the best database for this project?', 
     '["PostgreSQL", "MySQL", "MongoDB", "SQLite"]', 
     false);

-- Insert sample votes
INSERT INTO votes (poll_id, option_index) VALUES
    (1, 0), (1, 1), (1, 0), (1, 2), (1, 1), (1, 0),
    (2, 0), (2, 0), (2, 1), (2, 0),
    (3, 0), (3, 0), (3, 1);

-- Display sample data
SELECT 'Polls:' as info;
SELECT id, question, options, is_active, created_at FROM polls;

SELECT 'Votes:' as info;
SELECT poll_id, option_index, COUNT(*) as vote_count 
FROM votes 
GROUP BY poll_id, option_index 
ORDER BY poll_id, option_index;