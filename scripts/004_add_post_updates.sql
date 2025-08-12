-- Create post_updates table for replies/updates to posts
CREATE TABLE IF NOT EXISTS post_updates (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    image_url TEXT,
    user_session TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_post_updates_post_id ON post_updates(post_id);
CREATE INDEX IF NOT EXISTS idx_post_updates_created_at ON post_updates(created_at DESC);
