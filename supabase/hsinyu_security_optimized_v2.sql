-- ==========================================
-- HsinYu Final Security Script v2.0
-- 整合版：公告表 + 自動同步 Trigger + 雙重權限判定
-- ==========================================

-- [1] 重建公告表 (Announcements)
drop table if exists public.announcements cascade;

create table public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text,
  priority boolean default false,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;

-- 權限：所有人可讀
create policy "Anyone can view announcements" 
on public.announcements for select 
using (true);

-- 權限：最強大雙重判定 (同時檢查 JWT 與 Metadata)
create policy "Admin Manage Announcements" 
on public.announcements for all 
using (
  (auth.jwt() ->> 'role' = 'admin') 
  OR 
  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
);


-- [2] 自動同步角色機制 (Trigger)
-- 當 profiles 的 role 變更時，自動同步到 auth.users 的 metadata
create or replace function public.handle_sync_user_role()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data || jsonb_build_object('role', new.role)
  where id = new.id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_profile_role_update on public.profiles;
create trigger on_profile_role_update
  after update of role on public.profiles
  for each row execute procedure public.handle_sync_user_role();


-- [3] 資料完整性 (Foreign Key)
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_id_fkey,
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- [4] 維運備註
-- 升級管理員請執行：update public.profiles set role = 'admin', status = 'active' where email = 'YOUR_EMAIL';
