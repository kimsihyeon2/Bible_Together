-- Ensure table exists
create table if not exists public.bible_highlights (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  book text not null,
  chapter int not null,
  verse int not null,
  color text default 'yellow',
  content text default '',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.bible_highlights enable row level security;

-- Policies (Drop first to avoid errors on re-run)
drop policy if exists "Users can view highlights from their cell members" on public.bible_highlights;
drop policy if exists "Users can insert their own highlights" on public.bible_highlights;
drop policy if exists "Users can delete their own highlights" on public.bible_highlights;
drop policy if exists "Users can update their own highlights" on public.bible_highlights;

create policy "Users can view highlights from their cell members"
  on public.bible_highlights for select
  using (
    auth.uid() = user_id or 
    exists (
      select 1 from public.cell_members cm1
      join public.cell_members cm2 on cm1.cell_id = cm2.cell_id
      where cm1.user_id = auth.uid() and cm2.user_id = public.bible_highlights.user_id
    )
  );

create policy "Users can insert their own highlights"
  on public.bible_highlights for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own highlights"
  on public.bible_highlights for delete
  using (auth.uid() = user_id);

create policy "Users can update their own highlights"
  on public.bible_highlights for update
  using (auth.uid() = user_id);

-- RPC Function (Explicit public schema)
create or replace function public.get_cell_highlights(
  p_book text,
  p_chapter int
)
returns table (
  id uuid,
  user_id uuid,
  verse int,
  color text,
  user_name text
)
language plpgsql
security definer
as $$
declare
  v_cell_id uuid;
begin
  -- Get user's cell_id
  select cell_id into v_cell_id
  from public.cell_members
  where user_id = auth.uid()
  limit 1;

  if v_cell_id is null then
    -- If not in a cell, just return own highlights
    return query
    select 
      h.id,
      h.user_id,
      h.verse,
      h.color,
      p.name as user_name
    from public.bible_highlights h
    left join public.profiles p on h.user_id = p.id
    where h.user_id = auth.uid()
    and h.book = p_book
    and h.chapter = p_chapter;
  else
    -- Return cell members highlights
    return query
    select 
      h.id,
      h.user_id,
      h.verse,
      h.color,
      p.name as user_name
    from public.bible_highlights h
    join public.cell_members cm on h.user_id = cm.user_id
    left join public.profiles p on h.user_id = p.id
    where cm.cell_id = v_cell_id
    and h.book = p_book
    and h.chapter = p_chapter;
  end if;
end;
$$;

-- IMPORTANT: Reload PostgREST config to expose the new function immediately
NOTIFY pgrst, 'reload config';
