
-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Trigger to auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Analyses table
create type public.analysis_category as enum ('outfit', 'interior');

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.analysis_category not null,
  image_url text not null,
  image_path text not null,
  missing jsonb not null default '[]'::jsonb,
  remove jsonb not null default '[]'::jsonb,
  summary text not null default '',
  score int,
  created_at timestamptz not null default now()
);

create index idx_analyses_user on public.analyses(user_id, created_at desc);

alter table public.analyses enable row level security;

create policy "Users can view own analyses"
  on public.analyses for select using (auth.uid() = user_id);
create policy "Users can insert own analyses"
  on public.analyses for insert with check (auth.uid() = user_id);
create policy "Users can delete own analyses"
  on public.analyses for delete using (auth.uid() = user_id);

-- Storage bucket
insert into storage.buckets (id, name, public)
values ('analysis-images', 'analysis-images', true)
on conflict (id) do nothing;

create policy "Analysis images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'analysis-images');

create policy "Users can upload own analysis images"
  on storage.objects for insert
  with check (
    bucket_id = 'analysis-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete own analysis images"
  on storage.objects for delete
  using (
    bucket_id = 'analysis-images'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
