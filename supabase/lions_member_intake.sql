create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.lion_member_submissions (
  id uuid primary key default gen_random_uuid(),
  participant_type text not null default 'current_member',
  first_name text not null,
  middle_name text,
  last_name text not null,
  local_name text,
  nickname text,
  mobile text,
  preferred_email text,
  alternate_email text,
  address_line_1 text,
  address_line_2 text,
  suburb text,
  state_province text default 'New South Wales',
  postal_code text,
  country text default 'Australia',
  birth_date date,
  gender text,
  occupation text,
  spouse_name text,
  sponsor_name text,
  additional_notes text,
  consent boolean not null default false,
  review_status text not null default 'new',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint lion_member_submission_contact_check
    check (
      nullif(trim(coalesce(mobile, '')), '') is not null
      or nullif(trim(coalesce(preferred_email, '')), '') is not null
    ),
  constraint lion_member_submission_consent_check
    check (consent = true),
  constraint lion_member_submission_review_status_check
    check (review_status in ('new', 'reviewed', 'exported'))
);

alter table public.lion_member_submissions
add column if not exists participant_type text not null default 'current_member';

alter table public.lion_member_submissions
drop constraint if exists lion_member_submission_participant_type_check;

alter table public.lion_member_submissions
add constraint lion_member_submission_participant_type_check
check (participant_type in ('current_member', 'interested_in_joining', 'activity_guest'));

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_lion_member_submissions_updated_at on public.lion_member_submissions;

create trigger set_lion_member_submissions_updated_at
before update on public.lion_member_submissions
for each row
execute function public.set_updated_at();

create index if not exists lion_member_submissions_created_at_idx
  on public.lion_member_submissions(created_at desc);
create index if not exists lion_member_submissions_review_status_idx
  on public.lion_member_submissions(review_status);
create index if not exists lion_member_submissions_participant_type_idx
  on public.lion_member_submissions(participant_type);
create index if not exists lion_member_submissions_name_idx
  on public.lion_member_submissions using gin ((first_name || ' ' || last_name) gin_trgm_ops);
create index if not exists lion_member_submissions_mobile_idx
  on public.lion_member_submissions using gin (mobile gin_trgm_ops);
create index if not exists lion_member_submissions_email_idx
  on public.lion_member_submissions using gin (preferred_email gin_trgm_ops);

alter table public.lion_member_submissions enable row level security;

drop policy if exists "anon can insert lion member submissions" on public.lion_member_submissions;
drop policy if exists "authenticated can read lion member submissions" on public.lion_member_submissions;
drop policy if exists "authenticated can update lion member submissions" on public.lion_member_submissions;
drop policy if exists "authenticated can delete lion member submissions" on public.lion_member_submissions;

create policy "anon can insert lion member submissions"
on public.lion_member_submissions
for insert
to anon
with check (
  consent = true
  and review_status = 'new'
);

create policy "authenticated can read lion member submissions"
on public.lion_member_submissions
for select
to authenticated
using (true);

create policy "authenticated can update lion member submissions"
on public.lion_member_submissions
for update
to authenticated
using (true)
with check (consent = true);

create policy "authenticated can delete lion member submissions"
on public.lion_member_submissions
for delete
to authenticated
using (true);
