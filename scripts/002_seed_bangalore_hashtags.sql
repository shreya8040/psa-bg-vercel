-- Insert common Bangalore area hashtags
INSERT INTO hashtags (name) VALUES 
    ('koramangala'),
    ('indiranagar'),
    ('whitefield'),
    ('electronic-city'),
    ('mg-road'),
    ('brigade-road'),
    ('jayanagar'),
    ('malleshwaram'),
    ('rajajinagar'),
    ('hebbal'),
    ('silk-board'),
    ('marathahalli'),
    ('btm-layout'),
    ('jp-nagar'),
    ('banashankari'),
    ('yelahanka'),
    ('sarjapur-road'),
    ('outer-ring-road'),
    ('hosur-road'),
    ('tumkur-road')
ON CONFLICT (name) DO NOTHING;
