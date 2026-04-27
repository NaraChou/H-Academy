# 🪄 Kiki Design x Cursor Agent: 專案級 AI 協作手冊 (精細版)

> **規範版本**：`v2.1.0` (含 Supabase RLS、路由、部署與型別規範)
> **核心理念**：本手冊為開發者專用，詳細記錄了 HsinYu 專案的底層結構、資料流向與安全邏輯。

---

## 🗂️ 專案架構樹 (精細開發版)

```text
HsinYu/                                            # 專案根目錄
├── .cursor/                                       # [01] Cursor 規則系統
│   └── rules/                                     # AI 規則卡 (00-governance ~ 05-commands)
├── supabase/                                      # [02] Supabase 資料庫層
│   ├── functions/                                 # Edge Functions (邀請學生、自動化邏輯)
│   └── migrations/                                # 核心 SQL 腳本備份 (重要！)
│       ├── 20240427_audit_logs_setup.sql          # 操作日誌系統
│       ├── 20240427_hsinyu_final_security_v2.sql  # 公告與角色同步
│       ├── 20240427_student_checkin_setup.sql     # 學生打卡系統
│       └── ... (其他權限腳本)
├── src/                                           # [03] 應用程式原始碼
│   ├── components/                                # React 元件 (common, layout, sections)
│   ├── css/                                       # Kiki Style 樣式層 (Layer 0-2)
│   ├── data/                                      # 資料管理層 (appData, projectData)
│   ├── pages/                                     # 頁面入口 (與路由對應)
│   └── lib/                                       # 外部庫初始化 (supabase.ts)
├── SQL_V2_GUIDE.md                                # [04] 資料庫維運新手教學
├── MAINTENANCE_GUIDE.sql                          # [05] 維運快速指令備份
├── DEVELOPER_GUIDE.md                             # [06] AI 架構聖經
└── README.md                                      # [07] 專案精簡概述 (對外)
```

---

## 🔐 資料庫 Schema (Supabase)

| 表格 | 說明 | 核心權限規則 (RLS) |
|---|---|---|
| `profiles` | 使用者主檔 | 使用者僅能查看本人；管理員/老師可查看全體學生。 |
| `attendance_logs` | 打卡紀錄 | 學生僅能查看本人；管理員可幫學生打卡。 |
| `grade_records` | 成績紀錄 | 學生僅能查看本人；老師/管理員具備增刪改查權限。 |
| `announcements` | 公告系統 | 所有人可讀；僅限管理員管理。 |
| `audit_logs` | 操作日誌 | 系統自動寫入；僅限管理員查看。 |

### 帳號狀態機
```
invited ──(點邀請信 + 首次登入)──▶ active
active  ──(admin 停權)──────────▶ suspended
suspended ──(admin 解除)─────────▶ active
active  ──(畢業/停用)───────────▶ archived
```

---

## 🛣️ 路由一覽 (Routing)

| 路徑 | 元件 | 說明 |
|---|---|---|
| `/` | `Home` | 首頁 |
| `/about` | `About` | 關於欣育 |
| `/education` | `Education` | 全齡課程 |
| `/campus` | `Campus` | 分校榮譽 |
| `/news` | `News` | 公告中心 |
| `/login` | `Login` | 登入 |
| `/activate` | `Activate` | 帳號啟用 (邀請信連結) |
| `/dashboard` | `Dashboard` | 學術入口 (需登入 + status=active) |

---

## ⚡ Edge Function 部署指令

```bash
# 1. 登入 Supabase CLI
supabase login

# 2. 連結專案
supabase link --project-ref <YOUR_PROJECT_REF>

# 3. 部署邀請學生 Function
supabase functions deploy invite-student

# 4. 設定環境變數
supabase secrets set SITE_URL=https://your-domain.com
```

---

## 🛠️ 開發規範與型別檢查

### 型別檢查 (Type Check)
```bash
# 執行 lint 檢查
npm run lint

# 執行型別檢查
npx tsc --noEmit
```

### 角色同步機制 (Trigger)
當在 `profiles` 修改 `role` 時，資料庫觸發器會自動同步更新 Supabase Auth 的 `app_metadata`，確保權限即時生效。

---

## 🗣️ 與 Cursor AI 的協作指令
*   **`/Preflight`**：交付前執行，檢查樣式與結構是否符合 Kiki Design System。
*   **`/FormatKiki`**：優化 Tailwind class 排序與樣式抽離。
*   **`@SQL_V2_GUIDE.md`**：修改資料庫或 Dashboard 時，強迫 AI 讀取此文件。

---
**欣育文理 HsinYu — 首席視覺轉譯工程師 Manus 製作**
*版本：v2.1.0*
