-- Seed 10 avatar image paths. Replace the URLs with your hosted images or place them in /public/avatars
INSERT INTO avatars (id, image_url) VALUES
(1, '/avatars/avatar-1.png'),
(2, '/avatars/avatar-2.png'),
(3, '/avatars/avatar-3.png'),
(4, '/avatars/avatar-4.png'),
(5, '/avatars/avatar-5.png'),
(6, '/avatars/avatar-6.png'),
(7, '/avatars/avatar-7.png'),
(8, '/avatars/avatar-8.png'),
(9, '/avatars/avatar-9.png'),
(10, '/avatars/avatar-10.png')
ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url;

-- Optional: example people seeds (you can remove or adapt these)
INSERT INTO people (name, avatar_id)
VALUES
('Alex', 1),
('Sam', 2),
('Jamie', 3)
ON CONFLICT DO NOTHING;