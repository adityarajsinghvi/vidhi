-- Adds a public, unguessable token per wedding so the read-only client
-- share view (no login) can look a wedding up without RLS, via the
-- service-role admin client, scoped only to this one column's value.
alter table public.weddings add column share_token text unique;
create index weddings_share_token_idx on public.weddings (share_token) where share_token is not null;
