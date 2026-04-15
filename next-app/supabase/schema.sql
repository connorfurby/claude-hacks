-- Pulse schema
-- Run this in your Supabase SQL editor before first deploy

CREATE TABLE IF NOT EXISTS spaces (
  id   TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('university', 'city')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topics (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id   TEXT NOT NULL REFERENCES spaces(id),
  name       TEXT NOT NULL,
  post_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('scale', 'boolean', 'choice')),
  options    JSONB,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id    UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value       TEXT NOT NULL
);

-- Atomic post count increment (avoids read-modify-write race)
CREATE OR REPLACE FUNCTION increment_post_count(p_topic_id UUID)
RETURNS VOID AS $$
  UPDATE topics SET post_count = post_count + 1 WHERE id = p_topic_id;
$$ LANGUAGE SQL;

-- Seed default spaces
INSERT INTO spaces (id, name, type) VALUES
  ('utaustin',  'UT Austin',      'university'),
  ('mit',       'MIT',            'university'),
  ('ucla',      'UCLA',           'university'),
  ('austin-tx', 'Austin, TX',     'city'),
  ('nyc',       'New York City',  'city')
ON CONFLICT (id) DO NOTHING;
