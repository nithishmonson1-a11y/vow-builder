-- Vow Builder schema
-- Run this in your Supabase SQL editor

-- couples
create table if not exists couples (
  id uuid primary key default gen_random_uuid(),
  partner_a_id text not null,
  partner_b_id text not null,
  current_phase text not null default 'not_started',
  -- phase values: 'not_started', 'thursday_foundation', 'friday_mirror',
  --               'saturday_bridge', 'sunday_synthesis', 'sunday_reveal', 'complete'
  phase_started_at timestamptz,
  experiment_started_at timestamptz,
  created_at timestamptz default now()
);

-- answers
create table if not exists answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  user_id text not null,  -- 'a' or 'b'
  phase text not null,
  question_number int not null,
  question_text text not null,
  answer_text text,
  audio_url text,
  input_method text not null,  -- 'voice' or 'text'
  created_at timestamptz default now(),
  unique (couple_id, user_id, phase, question_number)
);

-- generated_content
create table if not exists generated_content (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid references couples(id) not null,
  user_id text,           -- 'a' or 'b'
  phase text not null,
  content_type text not null,  -- 'questions', 'reading', 'draft'
  content jsonb not null,
  created_at timestamptz default now(),
  unique (couple_id, user_id, phase, content_type)
);

-- Storage bucket (create manually in Supabase dashboard or via this SQL):
-- insert into storage.buckets (id, name, public) values ('voice-recordings', 'voice-recordings', true);

-- RLS: disable for all tables since we use service role key server-side
alter table couples disable row level security;
alter table answers disable row level security;
alter table generated_content disable row level security;
