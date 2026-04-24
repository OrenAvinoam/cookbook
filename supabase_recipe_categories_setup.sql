-- Recipe Categories table
-- Run this in the Supabase SQL Editor

create table if not exists recipe_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table recipe_categories enable row level security;

create policy "Authenticated users can read recipe categories"
  on recipe_categories for select to authenticated using (true);

create policy "Authenticated users can manage recipe categories"
  on recipe_categories for all to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- Seed default categories (only if table is empty)
insert into recipe_categories (name, sort_order)
select name, sort_order from (values
  ('breakfast', 0),
  ('lunch',     1),
  ('dinner',    2),
  ('snack',     3),
  ('dessert',   4)
) as v(name, sort_order)
where not exists (select 1 from recipe_categories limit 1);
