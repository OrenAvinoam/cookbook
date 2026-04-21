-- Run this in your Supabase SQL Editor (after the initial supabase_setup.sql)

-- Add new columns to recipes
alter table recipes add column if not exists category text default 'other';
alter table recipes add column if not exists tag_ids jsonb default '[]'::jsonb;
alter table recipes add column if not exists nutrition jsonb;

-- Create tags table
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  color text default '#6A9E82'
);
alter table tags enable row level security;
create policy "Allow all" on tags for all using (true) with check (true);

-- Update seed recipe categories
update recipes set category = 'breakfast' where title = 'Collagen Bone Broth';
update recipes set category = 'snack' where title = 'Collagen Gummies';
