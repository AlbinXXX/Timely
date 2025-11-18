-- Seed data for time tracker
-- Session 1: November 1, 2025, 10:47 - 18:47 (8 hours)
INSERT INTO sessions (id, start, pauses, resumes, end, total_seconds) VALUES (
  'seed-2025-11-01',
  '2025-11-01T10:47:00Z',
  '[]',
  '[]',
  '2025-11-01T18:47:00Z',
  28800
);

-- Session 2: November 18, 2024, 7:30 - 10:00 (2.5 hours)
INSERT INTO sessions (id, start, pauses, resumes, end, total_seconds) VALUES (
  'seed-2024-11-18-morning',
  '2024-11-18T07:30:00Z',
  '[]',
  '[]',
  '2024-11-18T10:00:00Z',
  9000
);

-- Session 3: November 18, 2024, 17:00 - 21:49 (4 hours 49 minutes)
INSERT INTO sessions (id, start, pauses, resumes, end, total_seconds) VALUES (
  'seed-2024-11-18-evening',
  '2024-11-18T17:00:00Z',
  '[]',
  '[]',
  '2024-11-18T21:49:00Z',
  17340
);
