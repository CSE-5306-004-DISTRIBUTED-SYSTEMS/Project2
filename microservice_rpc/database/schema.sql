
-- -- Poll table
-- CREATE TABLE poll (
--     uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     poll_question TEXT NOT NULL,
--     options TEXT[] NOT NULL,
--     status VARCHAR(10) CHECK (status IN ('open', 'close')) NOT NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- -- Vote table
-- CREATE TABLE vote (
--     id SERIAL PRIMARY KEY,
--     user_id UUID NOT NULL,
--     selected_option TEXT NOT NULL,
--     vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     poll_uuid UUID REFERENCES poll(uuid) ON DELETE CASCADE
-- );


CREATE TABLE IF NOT EXISTS poll (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_questions TEXT NOT NULL,
    options TEXT[] NOT NULL,
    status TEXT CHECK (status IN ('open', 'close')) DEFAULT 'open',
    create_at_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vote (
    userID TEXT NOT NULL,
    select_options TEXT NOT NULL,
    vote_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid UUID REFERENCES poll(uuid),
    PRIMARY KEY (uuid,userID) --limit user per vote at a poll.
);