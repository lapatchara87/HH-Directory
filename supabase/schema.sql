-- HuaHed Document Hub - Database Schema
-- Run this in your Supabase SQL editor

-- Enable RLS
alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;

-- Categories table
create table if not exists public.categories (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  color text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- Documents table
create table if not exists public.documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  category_id integer references public.categories(id) on delete set null,
  file_type text not null check (file_type in ('google_doc', 'google_sheet', 'google_slide', 'pdf', 'image', 'video', 'link')),
  file_url text,
  drive_link text,
  tags text[] default '{}',
  uploaded_by text not null,
  uploader_name text,
  file_size text,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Onboarding steps table
create table if not exists public.onboarding_steps (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  document_id uuid references public.documents(id) on delete set null,
  display_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Users table (synced from auth)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  domain text generated always as (split_part(email, '@', 2)) stored,
  full_name text,
  avatar_url text,
  role text default 'staff' check (role in ('admin', 'staff')),
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_documents_category on public.documents(category_id);
create index if not exists idx_documents_file_type on public.documents(file_type);
create index if not exists idx_documents_updated_at on public.documents(updated_at desc);
create index if not exists idx_documents_is_archived on public.documents(is_archived);
create index if not exists idx_documents_tags on public.documents using gin(tags);
create index if not exists idx_onboarding_steps_order on public.onboarding_steps(display_order);

-- Full text search
alter table public.documents add column if not exists fts tsvector
  generated always as (
    setweight(to_tsvector('simple', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(tags, ' '), '')), 'C')
  ) stored;
create index if not exists idx_documents_fts on public.documents using gin(fts);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on public.documents
  for each row execute function update_updated_at();

-- Row Level Security
alter table public.documents enable row level security;
alter table public.categories enable row level security;
alter table public.onboarding_steps enable row level security;
alter table public.users enable row level security;

-- Policies: authenticated users can read everything
create policy "Anyone authenticated can read documents"
  on public.documents for select
  to authenticated
  using (true);

create policy "Anyone authenticated can insert documents"
  on public.documents for insert
  to authenticated
  with check (true);

create policy "Admins can update documents"
  on public.documents for update
  to authenticated
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
    or uploaded_by = (select email from public.users where id = auth.uid())
  );

create policy "Admins can delete documents"
  on public.documents for delete
  to authenticated
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Anyone authenticated can read categories"
  on public.categories for select to authenticated using (true);

create policy "Anyone authenticated can read onboarding"
  on public.onboarding_steps for select to authenticated using (true);

create policy "Admins can manage onboarding"
  on public.onboarding_steps for all
  to authenticated
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy "Users can read own profile"
  on public.users for select
  to authenticated
  using (id = auth.uid());

create policy "Users can read all users"
  on public.users for select
  to authenticated
  using (true);

-- Seed categories
insert into public.categories (id, name, slug, description, icon, color, display_order) values
  (1, 'Company Document', 'company-document', 'Company policies, org documents', 'Building2', 'bg-blue-500', 1),
  (2, 'Workflow', 'workflow', 'Process maps, step-by-step procedures', 'GitBranch', 'bg-purple-500', 2),
  (3, 'HR', 'hr', 'Contracts, leave policies, HR documents', 'Users', 'bg-pink-500', 3),
  (4, 'Accounting', 'accounting', 'Invoices, financial reports', 'Calculator', 'bg-green-500', 4),
  (5, 'Master Template for AE', 'master-template-ae', 'All AE work templates', 'FileText', 'bg-orange-500', 5),
  (6, 'HuaHedHub', 'huahedhub', 'Documents for this project', 'FolderOpen', 'bg-indigo-500', 6),
  (7, 'Procandid', 'procandid', 'Procandid files and documents', 'Shield', 'bg-cyan-500', 7),
  (8, 'Allerguard', 'allerguard', 'Allerguard files and documents', 'Leaf', 'bg-emerald-500', 8),
  (9, 'TOR', 'tor', 'TOR files, government procurement', 'FileCheck', 'bg-red-500', 9),
  (10, 'ไฟล์บรีฟงาน', 'briefs', 'Project briefs', 'Briefcase', 'bg-amber-500', 10),
  (11, 'ความรู้ทั่วไป', 'knowledge', 'Articles, knowledge, references', 'BookOpen', 'bg-teal-500', 11)
on conflict (id) do nothing;

-- Function to handle new user creation from auth
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for auto-creating user profile
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for uploaded files
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

-- Storage policy
create policy "Anyone authenticated can upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'documents');

create policy "Anyone can view documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'documents');
