-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create enum types
create type user_role as enum ('administrator', 'class_supervisor', 'class_teacher', 'subject_teacher');
create type gender as enum ('male', 'female');
create type exam_status as enum ('draft', 'open', 'published');
create type academic_term as enum ('term_1', 'term_2', 'term_3');

-- Users table (extends auth.users with role and profile)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text not null,
  role user_role not null,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- School configuration
create table if not exists public.school_config (
  id uuid primary key default uuid_generate_v4(),
  school_name text not null,
  graduation_level integer not null default 9,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Grade boundaries configuration
create table if not exists public.grade_boundaries (
  id uuid primary key default uuid_generate_v4(),
  grade text not null,
  min_score integer not null,
  max_score integer not null,
  created_at timestamptz default now(),
  unique(grade)
);

-- Academic years
create table if not exists public.academic_years (
  id uuid primary key default uuid_generate_v4(),
  year_name text not null unique,
  start_date date not null,
  end_date date not null,
  is_current boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Classes (grade levels)
create table if not exists public.classes (
  id uuid primary key default uuid_generate_v4(),
  class_level integer not null unique,
  class_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Streams within classes
create table if not exists public.streams (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid not null references public.classes(id) on delete cascade,
  stream_name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(class_id, stream_name)
);

-- Subjects
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  subject_name text not null unique,
  subject_code text not null unique,
  max_score integer not null default 100,
  passing_grade text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Students
create table if not exists public.students (
  id uuid primary key default uuid_generate_v4(),
  admission_number text not null unique,
  assessment_number text not null,
  full_name text not null,
  gender gender not null,
  date_of_birth date not null,
  photo_url text,
  parent_name text not null,
  parent_phone text not null,
  parent_email text,
  current_stream_id uuid references public.streams(id),
  is_graduated boolean default false,
  graduated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Student academic history
create table if not exists public.student_history (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  stream_id uuid not null references public.streams(id) on delete cascade,
  created_at timestamptz default now(),
  unique(student_id, academic_year_id)
);

-- Student transfers
create table if not exists public.student_transfers (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  from_stream_id uuid references public.streams(id),
  to_stream_id uuid references public.streams(id),
  transfer_date date not null,
  transfer_reason text,
  destination_school text,
  created_at timestamptz default now()
);

-- Class supervisors (one per class level)
create table if not exists public.class_supervisors (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  created_at timestamptz default now(),
  unique(class_id, academic_year_id)
);

-- Class teachers (one per stream)
create table if not exists public.class_teachers (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  stream_id uuid not null references public.streams(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(stream_id, academic_year_id)
);

-- Subject teachers (many-to-many with streams and subjects)
create table if not exists public.subject_teachers (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  stream_id uuid not null references public.streams(id) on delete cascade,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  created_at timestamptz default now(),
  unique(teacher_id, subject_id, stream_id, academic_year_id)
);

-- Exams
create table if not exists public.exams (
  id uuid primary key default uuid_generate_v4(),
  exam_name text not null,
  academic_year_id uuid not null references public.academic_years(id) on delete cascade,
  term academic_term not null,
  status exam_status default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz,
  unique(exam_name, academic_year_id, term)
);

-- Exam subjects (which subjects are in this exam)
create table if not exists public.exam_subjects (
  id uuid primary key default uuid_generate_v4(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz default now(),
  unique(exam_id, subject_id)
);

-- Marks (scores for students)
create table if not exists public.marks (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.students(id) on delete cascade,
  exam_id uuid not null references public.exams(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  score numeric(5,2) not null,
  grade text not null,
  entered_by uuid not null references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(student_id, exam_id, subject_id)
);

-- Audit log
create table if not exists public.audit_log (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id),
  action text not null,
  table_name text not null,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now()
);

-- Insert default grade boundaries
insert into public.grade_boundaries (grade, min_score, max_score) values
  ('A', 80, 100),
  ('B', 70, 79),
  ('C', 60, 69),
  ('D', 50, 59),
  ('E', 40, 49),
  ('F', 0, 39)
on conflict (grade) do nothing;

-- Create function to calculate grade from score
create or replace function calculate_grade(score numeric)
returns text
language plpgsql
as $$
declare
  result_grade text;
begin
  select grade into result_grade
  from public.grade_boundaries
  where score >= min_score and score <= max_score
  limit 1;
  
  return coalesce(result_grade, 'F');
end;
$$;

-- Create function to handle user profile creation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'subject_teacher')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.school_config enable row level security;
alter table public.grade_boundaries enable row level security;
alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.streams enable row level security;
alter table public.subjects enable row level security;
alter table public.students enable row level security;
alter table public.student_history enable row level security;
alter table public.student_transfers enable row level security;
alter table public.class_supervisors enable row level security;
alter table public.class_teachers enable row level security;
alter table public.subject_teachers enable row level security;
alter table public.exams enable row level security;
alter table public.exam_subjects enable row level security;
alter table public.marks enable row level security;
alter table public.audit_log enable row level security;
