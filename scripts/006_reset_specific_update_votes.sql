-- Reset votes for the "Its solved" update in the "Depo to Channasandra" post
-- Find and delete votes for the specific update
DELETE FROM update_votes 
WHERE update_id IN (
    SELECT pu.id 
    FROM post_updates pu
    JOIN posts p ON pu.post_id = p.id
    WHERE p.content LIKE '%Depo to Channasandra%road repairs%'
    AND pu.content = 'Its solved'
);
