create table organizations (id serial primary key, name text not null);
create table users (id serial primary key, org_id int not null references organizations, email text not null, role text not null);
create table invoices (
  id serial primary key,              -- sequential: the next ID is easy to guess
  org_id int not null references organizations,
  customer_email text not null,
  amount_cents int not null,
  status text not null default 'open' -- open, paid, void
);
-- The API connects as ledgerly_api, which can read and write every row.
-- Row-level security is not enabled on any table.
