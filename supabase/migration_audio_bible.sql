-- Create table for storing Bible Audio (YouTube Video IDs)
create table if not exists bible_videos (
  id uuid default gen_random_uuid() primary key,
  book text not null,
  chapter int not null,
  video_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Add a distinct constraint to prevent duplicate mappings for the same chapter
  constraint bible_videos_book_chapter_key unique (book, chapter)
);

-- Enable RLS
alter table bible_videos enable row level security;

-- Policies
-- Everyone can read audio links
create policy "Allow public read access"
  on bible_videos for select
  using (true);

-- Only service role/admins can insert (for now, we'll manually seed or admin tool it)
create policy "Allow admin insert"
  on bible_videos for insert
  with check (auth.role() = 'service_role');

-- Create an index for faster lookups
create index if not exists bible_videos_lookup_idx on bible_videos (book, chapter);
