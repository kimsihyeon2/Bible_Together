-- Function to increment daily reading stats
create or replace function increment_daily_reading(
  p_user_id uuid,
  p_date date,
  p_chapters int,
  p_minutes int
)
returns void
language plpgsql
security definer
as $$
begin
  insert into daily_readings (user_id, reading_date, chapters_read, duration_seconds)
  values (p_user_id, p_date, p_chapters, p_minutes * 60)
  on conflict (user_id, reading_date)
  do update set
    chapters_read = daily_readings.chapters_read + p_chapters,
    duration_seconds = daily_readings.duration_seconds + (p_minutes * 60),
    updated_at = now();
end;
$$;
