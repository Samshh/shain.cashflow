create policy "allow anon inserts"
on public."user"
for insert
to anon
with check (true);