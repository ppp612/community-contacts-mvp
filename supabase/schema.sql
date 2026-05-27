create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  mobile text,
  email text,
  suburb text not null,
  language_preference text,
  main_concern text,
  location_detail text,
  source text,
  message text,
  volunteer_interest boolean default false,
  membership_interest boolean default false,
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

create trigger set_contacts_updated_at
before update on public.contacts
for each row
execute function public.set_updated_at();

create index if not exists contacts_created_at_idx on public.contacts(created_at desc);
create index if not exists contacts_suburb_idx on public.contacts(suburb);
create index if not exists contacts_source_idx on public.contacts(source);
create index if not exists contacts_main_concern_idx on public.contacts(main_concern);
create index if not exists contacts_follow_up_needed_idx on public.contacts(follow_up_needed);
create index if not exists interactions_contact_created_idx on public.interactions(contact_id, created_at desc);

alter table public.contacts enable row level security;
alter table public.interactions enable row level security;

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
