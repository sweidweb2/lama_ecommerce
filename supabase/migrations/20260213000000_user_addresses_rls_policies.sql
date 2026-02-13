--------------------------------------------------
-- User Addresses RLS Policies
-- Users can only select, insert, update, and delete their own addresses.
--------------------------------------------------

create policy "Users can manage own addresses (select)"
on user_addresses
for select
using (auth.uid() = user_id);

create policy "Users can manage own addresses (insert)"
on user_addresses
for insert
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (update)"
on user_addresses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own addresses (delete)"
on user_addresses
for delete
using (auth.uid() = user_id);
