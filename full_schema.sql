-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- Create enum types
create type user_role as enum (
  'administrator',
  'class_supervisor',
  'class_teacher',
  'subject_teacher'
);
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
  unique(
    teacher_id,
    subject_id,
    stream_id,
    academic_year_id
  )
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
  score numeric(5, 2) not null,
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
insert into public.grade_boundaries (grade, min_score, max_score)
values ('A', 80, 100),
  ('B', 70, 79),
  ('C', 60, 69),
  ('D', 50, 59),
  ('E', 40, 49),
  ('F', 0, 39) on conflict (grade) do nothing;
-- Create function to calculate grade from score
create or replace function calculate_grade(score numeric) returns text language plpgsql as $$
declare result_grade text;
begin
select grade into result_grade
from public.grade_boundaries
where score >= min_score
  and score <= max_score
limit 1;
return coalesce(result_grade, 'F');
end;
$$;
-- Create function to handle user profile creation
create or replace function public.handle_new_user() returns trigger language plpgsql security definer
set search_path = public as $$ begin
insert into public.users (id, email, full_name, role)
values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    case
      when not exists (
        select 1
        from public.users
      ) then 'administrator'::user_role
      else coalesce(
        (new.raw_user_meta_data->>'role')::user_role,
        'subject_teacher'::user_role
      )
    end
  ) on conflict (id) do nothing;
return new;
end;
$$;
-- Trigger for new user creation
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after
insert on auth.users for each row execute function public.handle_new_user();
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
-- RLS Policies
-- Users table policies
create policy "Users can view their own profile" on public.users for
select using (auth.uid() = id);
create policy "Administrators can view all users" on public.users for
select using (
    exists (
      select 1
      from public.users
      where id = auth.uid()
        and role = 'administrator'
    )
  );
create policy "Users can update their own profile" on public.users for
update using (auth.uid() = id);
create policy "Administrators can manage users" on public.users for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- School config policies (admin only)
create policy "Everyone can view school config" on public.school_config for
select using (auth.uid() is not null);
create policy "Administrators can manage school config" on public.school_config for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Grade boundaries policies
create policy "Everyone can view grade boundaries" on public.grade_boundaries for
select using (auth.uid() is not null);
create policy "Administrators can manage grade boundaries" on public.grade_boundaries for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Academic years policies
create policy "Everyone can view academic years" on public.academic_years for
select using (auth.uid() is not null);
create policy "Administrators can manage academic years" on public.academic_years for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Classes policies
create policy "Everyone can view classes" on public.classes for
select using (auth.uid() is not null);
create policy "Administrators can manage classes" on public.classes for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Streams policies
create policy "Everyone can view streams" on public.streams for
select using (auth.uid() is not null);
create policy "Administrators can manage streams" on public.streams for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Subjects policies
create policy "Everyone can view subjects" on public.subjects for
select using (auth.uid() is not null);
create policy "Administrators can manage subjects" on public.subjects for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Students policies
create policy "Everyone can view students" on public.students for
select using (auth.uid() is not null);
create policy "Administrators can manage students" on public.students for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Student history policies
create policy "Everyone can view student history" on public.student_history for
select using (auth.uid() is not null);
create policy "Administrators can manage student history" on public.student_history for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Student transfers policies
create policy "Everyone can view student transfers" on public.student_transfers for
select using (auth.uid() is not null);
create policy "Administrators can manage student transfers" on public.student_transfers for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Teacher assignment policies
create policy "Everyone can view class supervisors" on public.class_supervisors for
select using (auth.uid() is not null);
create policy "Administrators can manage class supervisors" on public.class_supervisors for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
create policy "Everyone can view class teachers" on public.class_teachers for
select using (auth.uid() is not null);
create policy "Administrators can manage class teachers" on public.class_teachers for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
create policy "Everyone can view subject teachers" on public.subject_teachers for
select using (auth.uid() is not null);
create policy "Administrators can manage subject teachers" on public.subject_teachers for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Exams policies
create policy "Everyone can view exams" on public.exams for
select using (auth.uid() is not null);
create policy "Administrators can manage exams" on public.exams for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Exam subjects policies
create policy "Everyone can view exam subjects" on public.exam_subjects for
select using (auth.uid() is not null);
create policy "Administrators can manage exam subjects" on public.exam_subjects for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Marks policies
create policy "Teachers can view marks for their assigned subjects" on public.marks for
select using (
    auth.uid() is not null
    and (
      -- Administrators can view all marks
      exists (
        select 1
        from public.users
        where id = auth.uid()
          and role = 'administrator'
      )
      or -- Subject teachers can view marks for their subjects
      exists (
        select 1
        from public.subject_teachers st
          join public.exam_subjects es on es.subject_id = st.subject_id
        where st.teacher_id = auth.uid()
          and es.exam_id = marks.exam_id
          and es.subject_id = marks.subject_id
      )
    )
  );
create policy "Subject teachers can insert marks for their subjects" on public.marks for
insert with check (
    exists (
      select 1
      from public.subject_teachers st
        join public.exam_subjects es on es.subject_id = st.subject_id
      where st.teacher_id = auth.uid()
        and es.exam_id = marks.exam_id
        and es.subject_id = marks.subject_id
    )
  );
create policy "Teachers can update marks before exam is published" on public.marks for
update using (
    exists (
      select 1
      from public.exams e
      where e.id = marks.exam_id
        and e.status != 'published'
        and (
          -- Administrators can always update
          exists (
            select 1
            from public.users
            where id = auth.uid()
              and role = 'administrator'
          )
          or -- Subject teachers can update their own subjects
          exists (
            select 1
            from public.subject_teachers st
            where st.teacher_id = auth.uid()
              and st.subject_id = marks.subject_id
          )
        )
    )
  );
create policy "Administrators can manage marks" on public.marks for all using (
  exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'administrator'
  )
);
-- Audit log policies
create policy "Administrators can view audit log" on public.audit_log for
select using (
    exists (
      select 1
      from public.users
      where id = auth.uid()
        and role = 'administrator'
    )
  );
create policy "System can insert audit log" on public.audit_log for
insert with check (true);
-- Seed initial school configuration
insert into public.school_config (school_name, graduation_level)
values ('My School', 9) on conflict do nothing;
-- Seed classes (Grade 1 to Grade 9)
insert into public.classes (class_level, class_name)
values (1, 'Grade 1'),
  (2, 'Grade 2'),
  (3, 'Grade 3'),
  (4, 'Grade 4'),
  (5, 'Grade 5'),
  (6, 'Grade 6'),
  (7, 'Grade 7'),
  (8, 'Grade 8'),
  (9, 'Grade 9') on conflict (class_level) do nothing;
-- Seed common subjects
insert into public.subjects (subject_name, subject_code, max_score)
values ('Mathematics', 'MATH', 100),
  ('English', 'ENG', 100),
  ('Science', 'SCI', 100),
  ('Social Studies', 'SST', 100),
  ('Kiswahili', 'KIS', 100),
  ('Religious Education', 'RE', 100),
  ('Physical Education', 'PE', 100),
  ('Creative Arts', 'CA', 100) on conflict (subject_code) do nothing;
-- Create current academic year
insert into public.academic_years (year_name, start_date, end_date, is_current)
values ('2025', '2025-01-01', '2025-12-31', true) on conflict (year_name) do nothing;
-- Create initial admin user
-- Note: This creates a user record, but you still need to sign up through Supabase Auth
-- After signing up with email: admin@school.com, this record will be linked
-- Insert a placeholder for admin user that will be linked when they sign up
-- The email 'admin@school.com' is suggested for the first admin
comment on table public.users is 'First user to sign up will automatically become admin';
-- Drop existing policies that cause infinite recursion
drop policy if exists "Administrators can view all users" on public.users;
drop policy if exists "Administrators can manage users" on public.users;
drop policy if exists "Administrators can manage school config" on public.school_config;
drop policy if exists "Administrators can manage grade boundaries" on public.grade_boundaries;
drop policy if exists "Administrators can manage academic years" on public.academic_years;
drop policy if exists "Administrators can manage classes" on public.classes;
drop policy if exists "Administrators can manage streams" on public.streams;
drop policy if exists "Administrators can manage subjects" on public.subjects;
drop policy if exists "Administrators can manage students" on public.students;
drop policy if exists "Administrators can manage student history" on public.student_history;
drop policy if exists "Administrators can manage student transfers" on public.student_transfers;
drop policy if exists "Administrators can manage class supervisors" on public.class_supervisors;
drop policy if exists "Administrators can manage class teachers" on public.class_teachers;
drop policy if exists "Administrators can manage subject teachers" on public.subject_teachers;
drop policy if exists "Administrators can manage exams" on public.exams;
drop policy if exists "Administrators can manage exam subjects" on public.exam_subjects;
drop policy if exists "Administrators can manage marks" on public.marks;
drop policy if exists "Administrators can view audit log" on public.audit_log;
-- Create a function to check if user is admin (avoids recursion)
create or replace function public.is_admin() returns boolean as $$ begin return (
    select role = 'administrator'
    from public.users
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;
-- Users table policies (fixed)
create policy "Administrators can view all users" on public.users for
select using (is_admin());
create policy "Administrators can manage users" on public.users for all using (is_admin());
create policy "New users can be created during signup" on public.users for
insert with check (auth.uid() = id);
-- School config policies (admin only)
create policy "Administrators can manage school config" on public.school_config for all using (is_admin());
-- Grade boundaries policies
create policy "Administrators can manage grade boundaries" on public.grade_boundaries for all using (is_admin());
-- Academic years policies
create policy "Administrators can manage academic years" on public.academic_years for all using (is_admin());
-- Classes policies
create policy "Administrators can manage classes" on public.classes for all using (is_admin());
-- Streams policies
create policy "Administrators can manage streams" on public.streams for all using (is_admin());
-- Subjects policies
create policy "Administrators can manage subjects" on public.subjects for all using (is_admin());
-- Students policies
create policy "Administrators can manage students" on public.students for all using (is_admin());
-- Student history policies
create policy "Administrators can manage student history" on public.student_history for all using (is_admin());
-- Student transfers policies
create policy "Administrators can manage student transfers" on public.student_transfers for all using (is_admin());
-- Teacher assignment policies
create policy "Administrators can manage class supervisors" on public.class_supervisors for all using (is_admin());
create policy "Administrators can manage class teachers" on public.class_teachers for all using (is_admin());
create policy "Administrators can manage subject teachers" on public.subject_teachers for all using (is_admin());
-- Exams policies
create policy "Administrators can manage exams" on public.exams for all using (is_admin());
-- Exam subjects policies
create policy "Administrators can manage exam subjects" on public.exam_subjects for all using (is_admin());
-- Marks policies (updated to use is_admin function)
drop policy if exists "Teachers can view marks for their assigned subjects" on public.marks;
drop policy if exists "Subject teachers can insert marks for their subjects" on public.marks;
drop policy if exists "Teachers can update marks before exam is published" on public.marks;
create policy "Teachers can view marks for their assigned subjects" on public.marks for
select using (
    is_admin()
    or exists (
      select 1
      from public.subject_teachers st
        join public.exam_subjects es on es.subject_id = st.subject_id
      where st.teacher_id = auth.uid()
        and es.exam_id = marks.exam_id
        and es.subject_id = marks.subject_id
    )
  );
create policy "Subject teachers can insert marks for their subjects" on public.marks for
insert with check (
    is_admin()
    or exists (
      select 1
      from public.subject_teachers st
        join public.exam_subjects es on es.subject_id = st.subject_id
      where st.teacher_id = auth.uid()
        and es.exam_id = marks.exam_id
        and es.subject_id = marks.subject_id
    )
  );
create policy "Teachers can update marks before exam is published" on public.marks for
update using (
    exists (
      select 1
      from public.exams e
      where e.id = marks.exam_id
        and e.status != 'published'
        and (
          is_admin()
          or exists (
            select 1
            from public.subject_teachers st
            where st.teacher_id = auth.uid()
              and st.subject_id = marks.subject_id
          )
        )
    )
  );
create policy "Administrators can manage marks" on public.marks for all using (is_admin());
-- Audit log policies
create policy "Administrators can view audit log" on public.audit_log for
select using (is_admin());