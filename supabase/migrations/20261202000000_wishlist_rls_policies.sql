--------------------------------------------------
-- Wishlist RLS Policies
--------------------------------------------------

-- Policy: Users can view their own wishlist items
create policy "Users can view own wishlist items"
on wishlists
for select
using (auth.uid() = user_id);

-- Policy: Users can insert their own wishlist items
create policy "Users can insert own wishlist items"
on wishlists
for insert
with check (auth.uid() = user_id);

-- Policy: Users can delete their own wishlist items
create policy "Users can delete own wishlist items"
on wishlists
for delete
using (auth.uid() = user_id);
