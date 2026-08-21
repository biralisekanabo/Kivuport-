-- KivuPort Supabase RLS policies
-- Run this file in Supabase SQL Editor.
-- The admin identity is intentionally restricted to one email.

create or replace function public.is_kivuport_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((auth.jwt() ->> 'email') = 'admin@portuaire.com', false);
$$;

revoke all on function public.is_kivuport_admin() from public;
grant execute on function public.is_kivuport_admin() to authenticated;

create or replace function public.get_or_create_kivuport_client(
  client_nom text,
  client_prenom text,
  client_email text,
  client_telephone text
)
returns table (id integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(client_email));
  existing_client_id integer;
begin
  if normalized_email <> lower(auth.jwt() ->> 'email') then
    raise exception 'Client email must match the authenticated user';
  end if;

  select c.id into existing_client_id
  from public.client as c
  where lower(c.email) = normalized_email
  limit 1;

  if existing_client_id is not null then
    update public.client
    set telephone = trim(client_telephone), updated_at = now()
    where id = existing_client_id;
    return query select existing_client_id;
    return;
  end if;

  begin
    return query
      insert into public.client(nom, prenom, email, telephone, date_inscription)
      values (trim(client_nom), trim(client_prenom), normalized_email, trim(client_telephone), now())
      returning client.id;
  exception when unique_violation then
    select c.id into existing_client_id
    from public.client as c
    where lower(c.email) = normalized_email
    limit 1;

    if existing_client_id is null then
      raise;
    end if;

    return query select existing_client_id;
  end;
end;
$$;

revoke all on function public.get_or_create_kivuport_client(text, text, text, text) from public;
grant execute on function public.get_or_create_kivuport_client(text, text, text, text) to authenticated;

-- Keep this setup script re-runnable in Supabase SQL Editor.
drop policy if exists "admin manages bateaux" on public.bateaux;
drop policy if exists "authenticated reads bateaux" on public.bateaux;
drop policy if exists "admin manages voyages" on public.voyages;
drop policy if exists "authenticated reads voyages" on public.voyages;
drop policy if exists "admin manages pavillons" on public.pavillons;
drop policy if exists "authenticated reads pavillons" on public.pavillons;
drop policy if exists "admin manages ports" on public.ports;
drop policy if exists "authenticated reads ports" on public.ports;
drop policy if exists "admin manages quais" on public.quais;
drop policy if exists "authenticated reads quais" on public.quais;
drop policy if exists "admin manages trajets" on public.trajets;
drop policy if exists "authenticated reads trajets" on public.trajets;
drop policy if exists "admin manages clients" on public.client;
drop policy if exists "admin manages reservations" on public.reservations;
drop policy if exists "admin manages paiements" on public.paiements;
drop policy if exists "client reads own profile" on public.client;
drop policy if exists "client creates own profile" on public.client;
drop policy if exists "client reads own reservations" on public.reservations;
drop policy if exists "client creates own reservations" on public.reservations;
drop policy if exists "client cancels own pending reservations" on public.reservations;
drop policy if exists "client reads own payments" on public.paiements;
drop policy if exists "client creates own payments" on public.paiements;

-- Reference data: authenticated clients may read available resources.
alter table public.bateaux enable row level security;
alter table public.voyages enable row level security;
alter table public.pavillons enable row level security;
alter table public.ports enable row level security;
alter table public.quais enable row level security;
alter table public.trajets enable row level security;

create policy "admin manages bateaux" on public.bateaux for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads bateaux" on public.bateaux for select to authenticated using (true);

create policy "admin manages voyages" on public.voyages for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads voyages" on public.voyages for select to authenticated using (true);

create policy "admin manages pavillons" on public.pavillons for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads pavillons" on public.pavillons for select to authenticated using (true);

create policy "admin manages ports" on public.ports for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads ports" on public.ports for select to authenticated using (true);

create policy "admin manages quais" on public.quais for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads quais" on public.quais for select to authenticated using (true);

create policy "admin manages trajets" on public.trajets for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "authenticated reads trajets" on public.trajets for select to authenticated using (true);

-- Client profiles and reservations.
alter table public.client enable row level security;
alter table public.reservations enable row level security;
alter table public.paiements enable row level security;

create policy "admin manages clients" on public.client for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "admin manages reservations" on public.reservations for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());
create policy "admin manages paiements" on public.paiements for all to authenticated using (public.is_kivuport_admin()) with check (public.is_kivuport_admin());

create policy "client reads own profile" on public.client for select to authenticated using (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "client creates own profile" on public.client for insert to authenticated with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "client reads own reservations" on public.reservations for select to authenticated using (
  idclient in (select id from public.client where lower(email) = lower(auth.jwt() ->> 'email'))
);
create policy "client creates own reservations" on public.reservations for insert to authenticated with check (
  idclient in (select id from public.client where lower(email) = lower(auth.jwt() ->> 'email'))
);
create policy "client cancels own pending reservations" on public.reservations for update to authenticated using (
  idclient in (select id from public.client where lower(email) = lower(auth.jwt() ->> 'email'))
  and statut = 'en_attente'
) with check (statut = 'annule');

create policy "client reads own payments" on public.paiements for select to authenticated using (
  idreservation in (
    select r.id from public.reservations r
    join public.client c on c.id = r.idclient
    where lower(c.email) = lower(auth.jwt() ->> 'email')
  )
);
create policy "client creates own payments" on public.paiements for insert to authenticated with check (
  statut = 'paye'
  and montant = (select r.prix_total from public.reservations r where r.id = idreservation and r.statut = 'confirme')
  and idreservation in (
    select r.id from public.reservations r
    join public.client c on c.id = r.idclient
    where lower(c.email) = lower(auth.jwt() ->> 'email') and r.statut = 'confirme'
  )
);
