-- Creates a helper function that lets authenticated users update their profile
-- information and syncs auth.users/auth.identities accordingly.
create or replace function public.update_account_profile(
  new_full_name text default null,
  new_email text default null
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user uuid := auth.uid();
begin
  if target_user is null then
    raise exception 'User must be authenticated to update account details';
  end if;

  if new_full_name is not null then
    update public.profiles
    set full_name = new_full_name
    where id = target_user;
  end if;

  if new_email is not null then
    update public.profiles
    set email = new_email
    where id = target_user;

    update auth.users
    set email = new_email,
        email_change = null,
        email_change_token_new = null,
        email_change_token_current = null,
        email_change_sent_at = null,
        email_change_confirm_status = 1,
        email_confirmed_at = coalesce(email_confirmed_at, now()),
        updated_at = now()
    where id = target_user;

    update auth.identities
    set email = new_email,
        identity_data = jsonb_set(identity_data, '{email}', to_jsonb(new_email), true),
        updated_at = now()
    where user_id = target_user
      and (provider = 'email' or provider = 'otp');
  end if;
end;
$$;

revoke all on function public.update_account_profile(text, text) from public;
grant execute on function public.update_account_profile(text, text) to authenticated;
