create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text,
  email text,
  suburb text not null,
  address text,
  language_preference text,
  main_concern text,
  location_detail text,
  source text,
  message text,
  volunteer_interest boolean default false,
  membership_interest boolean default false,
  book_club_member boolean default false,
  consent boolean not null default false,
  follow_up_needed boolean default false,
  follow_up_status text default 'new',
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint contacts_follow_up_status_check
    check (follow_up_status in ('new', 'contacted', 'in_progress', 'resolved', 'archived')),
  constraint contacts_consent_required_check
    check (consent = true)
);

alter table public.contacts
add column if not exists location_detail text;

alter table public.contacts
add column if not exists address text;

alter table public.contacts
add column if not exists book_club_member boolean default false;

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  interaction_type text,
  summary text not null,
  follow_up_required boolean default false,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  constraint interactions_type_check
    check (interaction_type in ('call', 'sms', 'email', 'in_person', 'social_media', 'other'))
);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  activity_date date not null,
  location text,
  suburb text,
  activity_type text,
  summary text,
  follow_up_notes text,
  important boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) default auth.uid(),
  constraint activities_type_check
    check (
      activity_type is null
      or activity_type in (
        'community_event',
        'resident_meeting',
        'business_walk',
        'school_visit',
        'council_meeting',
        'media',
        'other'
      )
    )
);

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

drop trigger if exists set_contacts_updated_at on public.contacts;
drop trigger if exists set_activities_updated_at on public.activities;
drop trigger if exists set_lion_member_submissions_updated_at on public.lion_member_submissions;

create trigger set_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create trigger set_activities_updated_at
before update on public.activities
for each row
execute function public.set_updated_at();

create trigger set_lion_member_submissions_updated_at
before update on public.lion_member_submissions
for each row
execute function public.set_updated_at();

create index if not exists contacts_created_at_idx on public.contacts(created_at desc);
create index if not exists contacts_suburb_idx on public.contacts(suburb);
create index if not exists contacts_source_idx on public.contacts(source);
create index if not exists contacts_main_concern_idx on public.contacts(main_concern);
create index if not exists contacts_follow_up_needed_idx on public.contacts(follow_up_needed);
create index if not exists contacts_follow_up_status_idx on public.contacts(follow_up_status);
create index if not exists contacts_volunteer_interest_idx on public.contacts(volunteer_interest);
create index if not exists contacts_book_club_member_idx on public.contacts(book_club_member);
create index if not exists contacts_follow_up_created_idx on public.contacts(follow_up_needed, created_at desc);
create index if not exists contacts_full_name_trgm_idx on public.contacts using gin (full_name gin_trgm_ops);
create index if not exists contacts_mobile_trgm_idx on public.contacts using gin (mobile gin_trgm_ops);
create index if not exists contacts_email_trgm_idx on public.contacts using gin (email gin_trgm_ops);
create index if not exists interactions_contact_created_idx on public.interactions(contact_id, created_at desc);
create index if not exists activities_activity_date_idx on public.activities(activity_date desc);
create index if not exists activities_important_idx on public.activities(important);
create index if not exists activities_suburb_idx on public.activities(suburb);
create index if not exists activities_type_idx on public.activities(activity_type);
create index if not exists activities_title_trgm_idx on public.activities using gin (title gin_trgm_ops);
create index if not exists lion_member_submissions_created_at_idx on public.lion_member_submissions(created_at desc);
create index if not exists lion_member_submissions_review_status_idx on public.lion_member_submissions(review_status);
create index if not exists lion_member_submissions_participant_type_idx on public.lion_member_submissions(participant_type);
create index if not exists lion_member_submissions_name_idx
  on public.lion_member_submissions using gin ((first_name || ' ' || last_name) gin_trgm_ops);
create index if not exists lion_member_submissions_mobile_idx
  on public.lion_member_submissions using gin (mobile gin_trgm_ops);
create index if not exists lion_member_submissions_email_idx
  on public.lion_member_submissions using gin (preferred_email gin_trgm_ops);

alter table public.contacts enable row level security;
alter table public.interactions enable row level security;
alter table public.activities enable row level security;
alter table public.lion_member_submissions enable row level security;

drop policy if exists "anon can insert contacts with consent" on public.contacts;
drop policy if exists "authenticated can read contacts" on public.contacts;
drop policy if exists "authenticated can update contacts" on public.contacts;
drop policy if exists "authenticated can delete contacts" on public.contacts;

create policy "anon can insert contacts with consent"
on public.contacts
for insert
to anon
with check (consent = true);

create policy "authenticated can read contacts"
on public.contacts
for select
to authenticated
using (true);

create policy "authenticated can update contacts"
on public.contacts
for update
to authenticated
using (true)
with check (consent = true);

create policy "authenticated can delete contacts"
on public.contacts
for delete
to authenticated
using (true);

drop policy if exists "authenticated can read interactions" on public.interactions;
drop policy if exists "authenticated can insert interactions" on public.interactions;
drop policy if exists "authenticated can update interactions" on public.interactions;
drop policy if exists "authenticated can delete interactions" on public.interactions;

create policy "authenticated can read interactions"
on public.interactions
for select
to authenticated
using (true);

create policy "authenticated can insert interactions"
on public.interactions
for insert
to authenticated
with check (auth.role() = 'authenticated');

create policy "authenticated can update interactions"
on public.interactions
for update
to authenticated
using (true)
with check (auth.role() = 'authenticated');

create policy "authenticated can delete interactions"
on public.interactions
for delete
to authenticated
using (true);

drop policy if exists "authenticated can read activities" on public.activities;
drop policy if exists "authenticated can insert activities" on public.activities;
drop policy if exists "authenticated can update activities" on public.activities;
drop policy if exists "authenticated can delete activities" on public.activities;

create policy "authenticated can read activities"
on public.activities
for select
to authenticated
using (true);

create policy "authenticated can insert activities"
on public.activities
for insert
to authenticated
with check (auth.role() = 'authenticated');

create policy "authenticated can update activities"
on public.activities
for update
to authenticated
using (true)
with check (auth.role() = 'authenticated');

create policy "authenticated can delete activities"
on public.activities
for delete
to authenticated
using (true);

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
