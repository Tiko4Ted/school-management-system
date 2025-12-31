-- Create initial admin user
-- Note: This creates a user record, but you still need to sign up through Supabase Auth
-- After signing up with email: admin@school.com, this record will be linked

-- First, we need to create a function that will automatically create a user profile
-- when someone signs up through Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Check if this is the first user (admin setup)
  if not exists (select 1 from public.users) then
    insert into public.users (id, email, full_name, role, status)
    values (new.id, new.email, 'System Administrator', 'admin', 'active');
  end if;
  return new;
end;
$$;

-- Create trigger to call the function when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Insert a placeholder for admin user that will be linked when they sign up
-- The email 'admin@school.com' is suggested for the first admin
comment on table public.users is 'First user to sign up will automatically become admin';
