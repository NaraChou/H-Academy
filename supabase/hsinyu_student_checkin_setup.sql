-- ==========================================
-- HsinYu Student Check-in System Setup
-- 學生端櫃檯打卡系統：資料表優化與 RLS 政策
-- ==========================================

-- [1] 確保 attendance_logs 表格結構正確
-- 如果表格不存在則建立，如果已存在則確保欄位完整
create table if not exists public.attendance_logs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references auth.users(id) on delete cascade not null,
  check_type text default 'in' check (check_type in ('in', 'out')),
  checked_at timestamptz default now()
);

-- [2] 啟用 RLS
alter table public.attendance_logs enable row level security;

-- [3] 設定 RLS 政策
-- 政策 A：學生可以查看自己的打卡紀錄
drop policy if exists "Students can view own attendance" on public.attendance_logs;
create policy "Students can view own attendance" 
on public.attendance_logs for select 
using ( auth.uid() = student_id );

-- 政策 B：管理員可以查看所有人的打卡紀錄
drop policy if exists "Admins can view all attendance" on public.attendance_logs;
create policy "Admins can view all attendance" 
on public.attendance_logs for select 
using ( (auth.jwt() ->> 'role' = 'admin') OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') );

-- 政策 C：管理員可以幫學生打卡 (櫃檯模式核心)
drop policy if exists "Admins can insert attendance" on public.attendance_logs;
create policy "Admins can insert attendance" 
on public.attendance_logs for insert 
with check ( (auth.jwt() ->> 'role' = 'admin') OR ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin') );

-- [4] 輔助索引：加速查詢
create index if not exists idx_attendance_student_id on public.attendance_logs(student_id);
create index if not exists idx_attendance_checked_at on public.attendance_logs(checked_at);
