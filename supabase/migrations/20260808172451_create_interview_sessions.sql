/*
# Create interview sessions table (single-tenant, no auth)

1. New Tables
- `interview_sessions`: stores completed AI interview sessions with conversation, scores, and final report.
  - `id` (uuid, primary key)
  - `candidate_id` (text, not null) — which synthetic candidate profile was interviewed
  - `candidate_name` (text, not null) — display name
  - `conversation` (jsonb, not null) — full chat history as array of messages
  - `question_count` (integer, not null, default 0)
  - `days_covered` (jsonb, not null) — array of curriculum day numbers
  - `scores` (jsonb, not null) — array of per-answer score objects
  - `final_report` (jsonb) — generated report with overall score, strengths, growth areas
  - `overall_score` (integer) — denormalized for quick sorting
  - `started_at` (timestamptz, not null)
  - `completed_at` (timestamptz)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `interview_sessions`.
- Allow anon + authenticated CRUD because this is a single-tenant demo app with no sign-in.
*/

CREATE TABLE IF NOT EXISTS interview_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id text NOT NULL,
  candidate_name text NOT NULL,
  conversation jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 0,
  days_covered jsonb NOT NULL DEFAULT '[]'::jsonb,
  scores jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_report jsonb,
  overall_score integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_interview_sessions" ON interview_sessions;
CREATE POLICY "anon_select_interview_sessions" ON interview_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_interview_sessions" ON interview_sessions;
CREATE POLICY "anon_insert_interview_sessions" ON interview_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_interview_sessions" ON interview_sessions;
CREATE POLICY "anon_update_interview_sessions" ON interview_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_interview_sessions" ON interview_sessions;
CREATE POLICY "anon_delete_interview_sessions" ON interview_sessions FOR DELETE
  TO anon, authenticated USING (true);
