-- Push Subscriptions table for FCM tokens
create table if not exists push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  fcm_token text not null unique,
  device_info text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table push_subscriptions enable row level security;

-- Policies
create policy "Users can manage their own subscriptions"
  on push_subscriptions for all
  using (auth.uid() = user_id);

create policy "Service role can read all subscriptions"
  on push_subscriptions for select
  using (auth.role() = 'service_role');

-- Index for faster lookups
create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);
create index if not exists push_subscriptions_active_idx on push_subscriptions (is_active) where is_active = true;
