-- Seed initial school configuration
insert into public.school_config (school_name, graduation_level)
values ('My School', 9)
on conflict do nothing;

-- Seed classes (Grade 1 to Grade 9)
insert into public.classes (class_level, class_name) values
  (1, 'Grade 1'),
  (2, 'Grade 2'),
  (3, 'Grade 3'),
  (4, 'Grade 4'),
  (5, 'Grade 5'),
  (6, 'Grade 6'),
  (7, 'Grade 7'),
  (8, 'Grade 8'),
  (9, 'Grade 9')
on conflict (class_level) do nothing;

-- Seed common subjects
insert into public.subjects (subject_name, subject_code, max_score) values
  ('Mathematics', 'MATH', 100),
  ('English', 'ENG', 100),
  ('Science', 'SCI', 100),
  ('Social Studies', 'SST', 100),
  ('Kiswahili', 'KIS', 100),
  ('Religious Education', 'RE', 100),
  ('Physical Education', 'PE', 100),
  ('Creative Arts', 'CA', 100)
on conflict (subject_code) do nothing;

-- Create current academic year
insert into public.academic_years (year_name, start_date, end_date, is_current)
values ('2025', '2025-01-01', '2025-12-31', true)
on conflict (year_name) do nothing;
