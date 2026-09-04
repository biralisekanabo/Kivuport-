-- KivuPort password reset OTP storage.
-- Durable storage required because serverless/edge function instances do not
-- share in-memory state between the forget-password and verify-otp requests.
-- Run this ONCE in the Supabase SQL Editor.

create table if not exists public.kivuport_otp (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.kivuport_otp enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'otp_service_role_all' and tablename = 'kivuport_otp'
  ) then
    create policy "otp_service_role_all"
      on public.kivuport_otp
      for all
      using (true)
      with check (true);
  end if;
end
$$;
