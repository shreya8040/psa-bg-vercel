-- Add image_url column to posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for posts with images
CREATE INDEX IF NOT EXISTS idx_posts_with_images ON posts(image_url) WHERE image_url IS NOT NULL;
