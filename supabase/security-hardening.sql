-- KivuPort data isolation hardening.
-- Run after admin-policies.sql, operations.sql and features.sql.
-- Client access is limited to the email in the authenticated Supabase JWT.

alter table public.client enable row level security;
alter table public.reservations enable row level security;
alter table public.paiements enable row level security;
alter table public.reservation_status_history enable row level security;
alter table public.payment_transactions enable row level security;

-- Remove legacy policies that could allow a client to write payment data directly.
drop policy if exists "client creates own payments" on public.paiements;
drop policy if exists "client updates own payments" on public.paiements;
drop policy if exists "client deletes own payments" on public.paiements;
drop policy if exists "client updates own reservations" on public.reservations;
drop policy if exists "client deletes own reservations" on public.reservations;

-- Recreate read policies so this file is safe to run repeatedly.
drop policy if exists "client reads own profile" on public.client;
drop policy if exists "client reads own reservations" on public.reservations;
drop policy if exists "client reads own payments" on public.paiements;
drop policy if exists "clients read own reservation status history" on public.reservation_status_history;

create policy "client reads own profile" on public.client
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "client reads own reservations" on public.reservations
  for select to authenticated
  using (
    exists (
      select 1 from public.client c
      where c.id = reservations.idclient
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "client reads own payments" on public.paiements
  for select to authenticated
  using (
    exists (
      select 1
      from public.reservations r
      join public.client c on c.id = r.idclient
      where r.id = paiements.idreservation
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "clients read own reservation status history" on public.reservation_status_history
  for select to authenticated
  using (
    exists (
      select 1
      from public.reservations r
      join public.client c on c.id = r.idclient
      where r.id = reservation_status_history.reservation_id
        and lower(c.email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Payment transaction references contain sensitive provider metadata.
-- Only the admin policy may read them; payment links use server-side service role.
revoke all on public.payment_transactions from anon;
grant select on public.payment_transactions to authenticated;

-- Anonymous users cannot read customer, reservation or payment tables.
revoke all on public.client from anon;
revoke all on public.reservations from anon;
revoke all on public.paiements from anon;
revoke all on public.reservation_status_history from anon;
