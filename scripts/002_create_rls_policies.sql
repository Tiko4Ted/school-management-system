-- RLS Policies

-- Users table policies
create policy "Users can view their own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Administrators can view all users"
  on public.users for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id);

create policy "Administrators can manage users"
  on public.users for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- School config policies (admin only)
create policy "Everyone can view school config"
  on public.school_config for select
  using (auth.uid() is not null);

create policy "Administrators can manage school config"
  on public.school_config for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Grade boundaries policies
create policy "Everyone can view grade boundaries"
  on public.grade_boundaries for select
  using (auth.uid() is not null);

create policy "Administrators can manage grade boundaries"
  on public.grade_boundaries for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Academic years policies
create policy "Everyone can view academic years"
  on public.academic_years for select
  using (auth.uid() is not null);

create policy "Administrators can manage academic years"
  on public.academic_years for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Classes policies
create policy "Everyone can view classes"
  on public.classes for select
  using (auth.uid() is not null);

create policy "Administrators can manage classes"
  on public.classes for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Streams policies
create policy "Everyone can view streams"
  on public.streams for select
  using (auth.uid() is not null);

create policy "Administrators can manage streams"
  on public.streams for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Subjects policies
create policy "Everyone can view subjects"
  on public.subjects for select
  using (auth.uid() is not null);

create policy "Administrators can manage subjects"
  on public.subjects for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Students policies
create policy "Everyone can view students"
  on public.students for select
  using (auth.uid() is not null);

create policy "Administrators can manage students"
  on public.students for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Student history policies
create policy "Everyone can view student history"
  on public.student_history for select
  using (auth.uid() is not null);

create policy "Administrators can manage student history"
  on public.student_history for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Student transfers policies
create policy "Everyone can view student transfers"
  on public.student_transfers for select
  using (auth.uid() is not null);

create policy "Administrators can manage student transfers"
  on public.student_transfers for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Teacher assignment policies
create policy "Everyone can view class supervisors"
  on public.class_supervisors for select
  using (auth.uid() is not null);

create policy "Administrators can manage class supervisors"
  on public.class_supervisors for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

create policy "Everyone can view class teachers"
  on public.class_teachers for select
  using (auth.uid() is not null);

create policy "Administrators can manage class teachers"
  on public.class_teachers for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

create policy "Everyone can view subject teachers"
  on public.subject_teachers for select
  using (auth.uid() is not null);

create policy "Administrators can manage subject teachers"
  on public.subject_teachers for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Exams policies
create policy "Everyone can view exams"
  on public.exams for select
  using (auth.uid() is not null);

create policy "Administrators can manage exams"
  on public.exams for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Exam subjects policies
create policy "Everyone can view exam subjects"
  on public.exam_subjects for select
  using (auth.uid() is not null);

create policy "Administrators can manage exam subjects"
  on public.exam_subjects for all
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Marks policies
create policy "Teachers can view marks for their assigned subjects"
  on public.marks for select
  using (
    auth.uid() is not null and (
      -- Administrators can view all marks
      exists (
        select 1 from public.users
        where id = auth.uid() and role = 'administrator'
      ) or
      -- Subject teachers can view marks for their subjects
      exists (
        select 1 from public.subject_teachers st
        join public.exam_subjects es on es.subject_id = st.subject_id
        where st.teacher_id = auth.uid()
        and es.exam_id = marks.exam_id
        and es.subject_id = marks.subject_id
      )
    )
  );

create policy "Subject teachers can insert marks for their subjects"
  on public.marks for insert
  with check (
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
        -- Administrators can always update
        exists (
          select 1 from public.users
          where id = auth.uid() and role = 'administrator'
        ) or
        -- Subject teachers can update their own subjects
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
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

-- Audit log policies
create policy "Administrators can view audit log"
  on public.audit_log for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'administrator'
    )
  );

create policy "System can insert audit log"
  on public.audit_log for insert
  with check (true);
