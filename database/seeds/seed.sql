-- Seed data for development and testing
-- Test user account as specified in spec.md: username='test', password='123456'

-- Note: Passwords should be hashed in production
-- For development only, using bcrypt hash of '123456'
INSERT IGNORE INTO users (username, password_hash) VALUES
('test', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW'); -- password: 123456

-- Add test user profile
INSERT IGNORE INTO user_profiles (user_id, age, height, weight, fitness_goal, fitness_frequency) VALUES
(1, 30, 175.00, 70.00, '减脂', 3);