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
create or replace function public.is_admin()
returns boolean as $$
begin
  return (
    select role = 'administrator'
    from public.users
    where id = auth.uid()
  );
end;
$$ language plpgsql security definer stable;

-- Users table policies (fixed)
create policy "Administrators can view all users"
  on public.users for select
  using (is_admin());

create policy "Administrators can manage users"
  on public.users for all
  using (is_admin());

create policy "New users can be created during signup"
  on public.users for insert
  with check (auth.uid() = id);

-- School config policies (admin only)
create policy "Administrators can manage school config"
  on public.school_config for all
  using (is_admin());

-- Grade boundaries policies
create policy "Administrators can manage grade boundaries"
  on public.grade_boundaries for all
  using (is_admin());

-- Academic years policies
create policy "Administrators can manage academic years"
  on public.academic_years for all
  using (is_admin());

-- Classes policies
create policy "Administrators can manage classes"
  on public.classes for all
  using (is_admin());

-- Streams policies
create policy "Administrators can manage streams"
  on public.streams for all
  using (is_admin());

-- Subjects policies
create policy "Administrators can manage subjects"
  on public.subjects for all
  using (is_admin());

-- Students policies
create policy "Administrators can manage students"
  on public.students for all
  using (is_admin());

-- Student history policies
create policy "Administrators can manage student history"
  on public.student_history for all
  using (is_admin());

-- Student transfers policies
create policy "Administrators can manage student transfers"
  on public.student_transfers for all
  using (is_admin());

-- Teacher assignment policies
create policy "Administrators can manage class supervisors"
  on public.class_supervisors for all
  using (is_admin());

create policy "Administrators can manage class teachers"
  on public.class_teachers for all
  using (is_admin());

create policy "Administrators can manage subject teachers"
  on public.subject_teachers for all
  using (is_admin());

-- Exams policies
create policy "Administrators can manage exams"
  on public.exams for all
  using (is_admin());

-- Exam subjects policies
create policy "Administrators can manage exam subjects"
  on public.exam_subjects for all
  using (is_admin());

-- Marks policies (updated to use is_admin function)
drop policy if exists "Teachers can view marks for their assigned subjects" on public.marks;
drop policy if exists "Subject teachers can insert marks for their subjects" on public.marks;
drop policy if exists "Teachers can update marks before exam is published" on public.marks;

create policy "Teachers can view marks for their assigned subjects"
  on public.marks for select
  using (
    is_admin() or
    exists (
      select 1 from public.subject_teachers st
      join public.exam_subjects es on es.subject_id = st.subject_id
      where st.teacher_id = auth.uid()
      and es.exam_id = marks.exam_id
      and es.subject_id = marks.subject_id
    )
  );

create policy "Subject teachers can insert marks for their subjects"
  on public.marks for insert
  with check (
    is_admin() or
    exists (
      select 1 from public.subject_teachers st
      join public.exam_subjects es on es.subject_id = st.subject_id
      where st.teacher_id = auth.uid()
      and es.exam_id = marks.exam_id
      and es.subject_id = marks.subject_id
    )
  );

create policy "Teachers can update marks before exam is published"
  on public.marks for update
  using (
    exists (
      select 1 from public.exams e
      where e.id = marks.exam_id
      and e.status != 'published'
      and (
        is_admin() or
        exists (
          select 1 from public.subject_teachers st
          where st.teacher_id = auth.uid()
          and st.subject_id = marks.subject_id
        )
      )
    )
  );

create policy "Administrators can manage marks"
  on public.marks for all
  using (is_admin());

-- Audit log policies
create policy "Administrators can view audit log"
  on public.audit_log for select
  using (is_admin());
