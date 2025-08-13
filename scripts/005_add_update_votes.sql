-- Create votes table for update voting
CREATE TABLE IF NOT EXISTS update_votes (
  id SERIAL PRIMARY KEY,
  update_id INTEGER NOT NULL REFERENCES post_updates(id) ON DELETE CASCADE,
  user_session TEXT NOT NULL,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(update_id, user_session)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_update_votes_update_id ON update_votes(update_id);
CREATE INDEX IF NOT EXISTS idx_update_votes_user_session ON update_votes(user_session);
