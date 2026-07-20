-- Product Q&A public RLS (storefront ask + read approved)
-- Mirrors reviews policies: approved (or own) SELECT; auth INSERT pending; admin ALL.

--------------------------------------------------
-- product_questions
--------------------------------------------------

drop policy if exists "Users can read product questions" on product_questions;
create policy "Users can read product questions"
on product_questions
for select
using (
  is_approved = true
  or auth.uid() = user_id
);

drop policy if exists "Users can insert own product questions" on product_questions;
create policy "Users can insert own product questions"
on product_questions
for insert
with check (
  auth.uid() = user_id
  and is_approved = false
);

drop policy if exists "Admins can manage product questions" on product_questions;
create policy "Admins can manage product questions"
on product_questions
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);

--------------------------------------------------
-- product_answers
--------------------------------------------------

drop policy if exists "Users can read product answers" on product_answers;
create policy "Users can read product answers"
on product_answers
for select
using (
  exists (
    select 1
    from product_questions pq
    where pq.id = product_answers.product_question_id
      and (
        pq.is_approved = true
        or auth.uid() = pq.user_id
      )
  )
);

drop policy if exists "Admins can manage product answers" on product_answers;
create policy "Admins can manage product answers"
on product_answers
for all
using (public.get_user_role() = 'admin'::profile_role)
with check (public.get_user_role() = 'admin'::profile_role);
